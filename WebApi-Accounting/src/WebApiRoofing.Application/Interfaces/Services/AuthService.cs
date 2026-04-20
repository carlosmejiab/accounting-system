using BCrypt.Net;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Application.DTOs.Auth;

namespace WebApiRoofing.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IAuditRepository _auditRepository;
    private readonly ITokenService _tokenService;

    public AuthService(
        IAuthRepository authRepository,
        IAuditRepository auditRepository,
        ITokenService tokenService)
    {
        _authRepository = authRepository;
        _auditRepository = auditRepository;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _authRepository.GetByUsernameAsync(request.Username);

        if (user == null)
        {
            return new LoginResponse
            {
                Success = false,
                Message = "Credenciales inválidas"
            };
        }

        // Verificar password
        bool isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isValidPassword)
        {
            return new LoginResponse
            {
                Success = false,
                Message = "Credenciales inválidas"
            };
        }

        // Verificar que el usuario esté activo
        if (user.Estado.ToString() != "Activo")
        {
            return new LoginResponse
            {
                Success = false,
                Message = "Usuario inactivo"
            };
        }

        // Generar token
        var token = _tokenService.GenerateJwtToken(user);

        // Registrar auditoría
        await _auditRepository.InsertAsync(
            user.Id,
            "LOGIN",
            "User",
            user.Id,
            $"{{\"username\":\"{user.Username}\"}}"
        );

        return new LoginResponse
        {
            Success = true,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Nombre = user.Nombre,
                Email = user.Email,
                Rol = user.Rol.ToString(),
                Avatar = user.Avatar
            },
            Token = token
        };
    }

    public async Task<bool> LogoutAsync(string token)
    {
        var jti = _tokenService.GetJtiFromToken(token);
        var expiresAt = _tokenService.GetExpirationFromToken(token);

        if (string.IsNullOrEmpty(jti) || expiresAt == null)
        {
            return false;
        }

        await _authRepository.RevokeTokenAsync(jti, token, expiresAt.Value, null);

        // Registrar auditoría (sin userId porque ya se deslogueó)
        await _auditRepository.InsertAsync(
            null,
            "LOGOUT",
            "User",
            null,
            $"{{\"jti\":\"{jti}\"}}"
        );

        return true;
    }

    public async Task<UserDto?> GetMeAsync(int userId)
    {
        var user = await _authRepository.GetMeAsync(userId);

        if (user == null)
        {
            return null;
        }

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Nombre = user.Nombre,
            Email = user.Email,
            Rol = user.Rol.ToString(),
            Avatar = user.Avatar
        };
    }
}