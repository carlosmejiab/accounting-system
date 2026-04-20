using Dapper;
using System.Data;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;
using WebApiRoofing.Domain.Enums;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    // Perfiles que se consideran "Admin" para el Rol técnico del JWT.
    // Si el usuario recibe uno de estos perfiles, se guarda Rol = "Admin" en dbo.Users.
    // Cualquier otro perfil → Rol = "User".
    private static readonly HashSet<string> AdminProfileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Super Administrador",
        "Administrador"
    };

    public UserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // ===================================
    // GET ROLES — llama al SP spUsers_GetRoles
    // Devuelve los perfiles activos de dbo.Profiles
    // como lista de { value (int), label (string) }
    // ===================================
    public async Task<IEnumerable<object>> GetRolesAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var roles = await connection.QueryAsync<dynamic>(
            "spUsers_GetRoles",
            commandType: CommandType.StoredProcedure
        );

        // El SP devuelve: value (int = ProfileId), label (string = Name)
        return roles.Select(r => new
        {
            value = (int)r.value,
            label = (string)r.label
        });
    }

    // ===================================
    // GET ALL — paginado con búsqueda
    // Incluye el perfil asignado al usuario (primer perfil de UserProfiles)
    // ===================================
    public async Task<(List<User> Items, int Total)> GetUsersAsync(
        int page, int pageSize, string? search, string? orderBy, string? orderDirection)
    {
        using var connection = _connectionFactory.CreateConnection();

        using var multi = await connection.QueryMultipleAsync(
            "spUsers_GetAll",
            new
            {
                Page = page,
                PageSize = pageSize,
                Search = string.IsNullOrWhiteSpace(search) ? null : search,
                OrderBy = orderBy ?? "CreatedAt",
                OrderDirection = orderDirection ?? "DESC"
            },
            commandType: CommandType.StoredProcedure
        );

        var items = (await multi.ReadAsync<dynamic>()).ToList();
        var totalObj = await multi.ReadFirstOrDefaultAsync<dynamic>();
        int total = totalObj?.TotalItems ?? 0;

        var users = items.Select(MapToUser).ToList();
        return (users, total);
    }

    // ===================================
    // GET BY ID
    // ===================================
    public async Task<User?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();

        var user = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spUsers_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure
        );

        return user == null ? null : MapToUser(user);
    }

    // ===================================
    // GET BY USERNAME
    // ===================================
    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var connection = _connectionFactory.CreateConnection();

        var user = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spUsers_GetByUsername",
            new { Username = username },
            commandType: CommandType.StoredProcedure
        );

        return user == null ? null : MapToUser(user);
    }

    // ===================================
    // CREATE — crea Employee + User vinculados
    //
    // Flujo:
    //  1. Determina el Rol técnico según perfil
    //  2. Inserta en dbo.Employees (para que aparezca en dropdowns)
    //  3. Llama a spUsers_Create
    //  4. Vincula IdEmployee en dbo.Users
    //  5. Asigna perfil en dbo.UserProfiles
    // ===================================
    public async Task<User> CreateAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();

        // 1. Rol técnico
        string rolTecnico = await GetRolTecnicoByProfileId(connection, user.ProfileId);

        // 2. Crear Employee con los datos del usuario
        var parts = user.Nombre.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        int idEmployee = await connection.ExecuteScalarAsync<int>(
            @"INSERT INTO dbo.Employees (FirstName, LastName, Email, MobilePhone, State, CreationDate, ModificationDate)
              VALUES (@FirstName, @LastName, @Email, @MobilePhone, '1', GETDATE(), GETDATE());
              SELECT CAST(SCOPE_IDENTITY() AS INT);",
            new
            {
                FirstName   = parts.Length > 0 ? parts[0] : user.Nombre,
                LastName    = parts.Length > 1 ? parts[1] : string.Empty,
                Email       = user.Email,
                MobilePhone = (string?)null,
            }
        );

        // 3. Crear usuario
        var created = await connection.QueryFirstAsync<dynamic>(
            "spUsers_Create",
            new
            {
                Username     = user.Username,
                PasswordHash = user.PasswordHash,
                Avatar       = user.Avatar,
                Nombre       = user.Nombre,
                Email        = user.Email,
                Rol          = rolTecnico
            },
            commandType: CommandType.StoredProcedure
        );

        var createdUser = MapToUser(created);

        // 4. Vincular IdEmployee en dbo.Users
        if (idEmployee > 0)
        {
            await connection.ExecuteAsync(
                "UPDATE dbo.Users SET IdEmployee = @IdEmployee WHERE Id = @Id",
                new { IdEmployee = idEmployee, Id = createdUser.Id }
            );
            createdUser.IdEmployee = idEmployee;
        }

        // 5. Asignar perfil
        if (user.ProfileId.HasValue)
        {
            await connection.ExecuteAsync(
                "spUsers_AssignProfiles",
                new
                {
                    UserId     = createdUser.Id,
                    ProfileIds = $"[{user.ProfileId.Value}]",
                    AssignedBy = user.CreatedByActorId
                },
                commandType: CommandType.StoredProcedure
            );
            createdUser.ProfileId = user.ProfileId;
        }

        return createdUser;
    }

    // ===================================
    // UPDATE — actualiza User + Employee vinculado
    // ===================================
    public async Task<User?> UpdateAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();

        // Obtener IdEmployee actual y Rol antes de actualizar
        string? rolTecnico = null;
        if (user.ProfileId.HasValue)
            rolTecnico = await GetRolTecnicoByProfileId(connection, user.ProfileId);

        var currentIdEmployee = await connection.ExecuteScalarAsync<int?>(
            "SELECT IdEmployee FROM dbo.Users WHERE Id = @Id",
            new { Id = user.Id }
        );

        var updated = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spUsers_Update",
            new
            {
                Id     = user.Id,
                Nombre = user.Nombre,
                Email  = user.Email,
                Rol    = rolTecnico ?? user.Rol.ToString()
            },
            commandType: CommandType.StoredProcedure
        );

        if (updated == null)
            return null;

        var updatedUser = MapToUser(updated);

        // Sincronizar Employee vinculado (Nombre y Email)
        if (currentIdEmployee.HasValue && currentIdEmployee > 0)
        {
            var parts = user.Nombre.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            await connection.ExecuteAsync(
                @"UPDATE dbo.Employees SET
                      FirstName        = @FirstName,
                      LastName         = @LastName,
                      Email            = @Email,
                      ModificationDate = GETDATE()
                  WHERE IdEmployee = @IdEmployee",
                new
                {
                    FirstName  = parts.Length > 0 ? parts[0] : user.Nombre,
                    LastName   = parts.Length > 1 ? parts[1] : string.Empty,
                    Email      = user.Email,
                    IdEmployee = currentIdEmployee.Value,
                }
            );
            updatedUser.IdEmployee = currentIdEmployee;
        }

        // Reasignar perfil si se proporcionó uno nuevo
        if (user.ProfileId.HasValue)
        {
            await connection.ExecuteAsync(
                "spUsers_AssignProfiles",
                new
                {
                    UserId     = updatedUser.Id,
                    ProfileIds = $"[{user.ProfileId.Value}]",
                    AssignedBy = user.CreatedByActorId
                },
                commandType: CommandType.StoredProcedure
            );
            updatedUser.ProfileId = user.ProfileId;
        }

        return updatedUser;
    }

    // ===================================
    // DELETE (soft delete)
    // ===================================
    public async Task<bool> DeleteAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();

        var result = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spUsers_Delete",
            new { Id = id },
            commandType: CommandType.StoredProcedure
        );

        return result?.RowsAffected > 0;
    }

    // ===================================
    // EXISTS USERNAME
    // ===================================
    public async Task<bool> ExistsUsernameAsync(string username, int? excludeId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var result = await connection.QueryFirstOrDefaultAsync<int?>(
            "spUsers_CheckUsername",
            new { Username = username, ExcludeId = excludeId },
            commandType: CommandType.StoredProcedure
        );

        return result.GetValueOrDefault() == 1;
    }

    // ===================================
    // EXISTS EMAIL
    // ===================================
    public async Task<bool> ExistsEmailAsync(string email, int? excludeId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var result = await connection.QueryFirstOrDefaultAsync<int?>(
            "spUsers_CheckEmail",
            new { Email = email, ExcludeId = excludeId },
            commandType: CommandType.StoredProcedure
        );

        return result.GetValueOrDefault() == 1;
    }

    // ===================================
    // HELPERS PRIVADOS
    // ===================================

    /// <summary>
    /// Consulta el nombre del perfil en dbo.Profiles y determina
    /// si el Rol técnico debe ser "Admin" o "User".
    /// Regla: "Super Administrador" y "Administrador" → Admin
    ///        Cualquier otro perfil                   → User
    /// </summary>
    private async Task<string> GetRolTecnicoByProfileId(
        System.Data.IDbConnection connection, int? profileId)
    {
        if (!profileId.HasValue)
            return "User";

        var profileName = await connection.QueryFirstOrDefaultAsync<string>(
            "SELECT Name FROM Profiles WHERE Id = @Id AND IsActive = 1",
            new { Id = profileId.Value }
        );

        return (profileName != null && AdminProfileNames.Contains(profileName))
            ? "Admin"
            : "User";
    }

    private static User MapToUser(dynamic data)
    {
        var d = (IDictionary<string, object>)data;
        return new User
        {
            Id           = (int)d["Id"],
            Username     = (string)d["Username"],
            Nombre       = (string)d["Nombre"],
            Email        = (string)d["Email"],
            Rol          = Enum.Parse<UserRole>((string)d["Rol"]),
            Avatar       = d.TryGetValue("Avatar",    out var av)  && av  != DBNull.Value ? (string)av  : null,
            Estado       = Enum.Parse<UserStatus>((string)d["Estado"]),
            PasswordHash = d.TryGetValue("PasswordHash", out var ph) && ph != DBNull.Value ? (string)ph : string.Empty,
            CreatedAt    = (DateTime)d["CreatedAt"],
            UpdatedAt    = d.TryGetValue("UpdatedAt", out var ua)  && ua  != DBNull.Value ? (DateTime?)ua : null,
            IdEmployee   = d.TryGetValue("IdEmployee", out var ie) && ie  != DBNull.Value ? (int?)Convert.ToInt32(ie) : null,
        };
    }
}