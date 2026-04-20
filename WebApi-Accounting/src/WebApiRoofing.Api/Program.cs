using WebApiRoofing.Application.Services;
using WebApiRoofing.Infrastructure.Repositories;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApiRoofing.Api.Middlewares;
using WebApiRoofing.Infrastructure.Data;
using WebApiRoofing.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// Configuration
// ========================================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// ========================================
// Services Registration
// ========================================

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger Configuration with JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Clean API SP",
        Version = "v1",
        Description = "ASP.NET Core Web API con Clean Architecture y Stored Procedures"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando el esquema Bearer. Ejemplo: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Database
builder.Services.AddSingleton<IDbConnectionFactory>(sp =>
    new DbConnectionFactory(connectionString));

// Repositories
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();

builder.Services.AddScoped<IProfileRepository, ProfileRepository>();
builder.Services.AddScoped<IModuleRepository, ModuleRepository>();
builder.Services.AddScoped<IPermissionRepository, PermissionRepository>();

// AGREGAR REPOSITORIO DE CLIENTES
builder.Services.AddScoped<IClientRepository, ClientRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
// ──────────────────────────────────────────────────────────────────────────────
// Contact Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<IContactService, ContactService>();

// ──────────────────────────────────────────────────────────────────────────────
// ClientAccount Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IClientAccountRepository, ClientAccountRepository>();
builder.Services.AddScoped<IClientAccountService, ClientAccountService>();

// AGREGAR SERVICIO DE CLIENTES
builder.Services.AddScoped<IClientService, ClientService>();

// ──────────────────────────────────────────────────────────────────────────────
// Task Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();

// ──────────────────────────────────────────────────────────────────────────────
// Tracking Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ITrackingRepository, TrackingRepository>();
builder.Services.AddScoped<ITrackingService, TrackingService>();

// ──────────────────────────────────────────────────────────────────────────────
// Event Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IEventService, EventService>();

// ──────────────────────────────────────────────────────────────────────────────
// Employee Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// ──────────────────────────────────────────────────────────────────────────────
// Document Services
// ──────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IStorageConfigRepository, StorageConfigRepository>();
builder.Services.AddScoped<IStorageConfigService, StorageConfigService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();

builder.Services.AddSingleton<ITokenService>(sp =>
    new TokenService(
        jwtSettings["SecretKey"]!,
        jwtSettings["Issuer"]!,
        jwtSettings["Audience"]!,
        int.Parse(jwtSettings["ExpirationMinutes"]!)
    ));

// JWT Authentication with Token Blacklist Validation
var secretKey = jwtSettings["SecretKey"]!;
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = JwtRegisteredClaimNames.UniqueName
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var jtiClaim = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

            if (!string.IsNullOrEmpty(jtiClaim))
            {
                var authRepository = context.HttpContext.RequestServices.GetRequiredService<IAuthRepository>();
                var isRevoked = await authRepository.IsTokenRevokedAsync(jtiClaim);

                if (isRevoked)
                {
                    context.Fail("Este token ha sido revocado");
                }
            }
        }
    };
});

builder.Services.AddAuthorization();

// ========================================
// Build App
// ========================================
var app = builder.Build();

// ========================================
// Middleware Pipeline
// ========================================

// Global Exception Handler
app.UseMiddleware<GlobalExceptionMiddleware>();

// SWAGGER - CONFIGURACIÓN CORREGIDA
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Clean API SP v1");
    //CAMBIO CRÍTICO: NO poner RoutePrefix = string.Empty
    // Esto hace que Swagger esté en /swagger en lugar de la raíz
});

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ========================================
// Run Application
// ========================================
app.Run();
