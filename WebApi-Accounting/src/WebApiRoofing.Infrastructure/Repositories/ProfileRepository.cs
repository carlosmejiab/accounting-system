using Dapper;
using System.Data;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

/// <summary>
/// Repositorio de perfiles usando Dapper
/// </summary>
public class ProfileRepository : IProfileRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ProfileRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// Obtener todos los perfiles
    /// </summary>
    public async Task<List<dynamic>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var profiles = await connection.QueryAsync<dynamic>(
            "spProfiles_GetAll",
            commandType: CommandType.StoredProcedure
        );

        return profiles.ToList();
    }

    /// <summary>
    /// Obtener perfil por ID con detalles
    /// </summary>
    public async Task<(dynamic? Profile, List<dynamic> Permissions, List<dynamic> Users)> GetByIdAsync(int profileId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ProfileId", profileId);

        using var multi = await connection.QueryMultipleAsync(
            "spProfiles_GetById",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        // Primer resultado: datos del perfil
        var profile = await multi.ReadFirstOrDefaultAsync<dynamic>();

        // Segundo resultado: permisos asignados
        var permissions = (await multi.ReadAsync<dynamic>()).ToList();

        // Tercer resultado: usuarios asignados
        var users = (await multi.ReadAsync<dynamic>()).ToList();

        return (profile, permissions, users);
    }

    /// <summary>
    /// Crear nuevo perfil
    /// </summary>
    public async Task<dynamic> CreateAsync(string name, string? description, int createdBy)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@Name", name);
        parameters.Add("@Description", description);
        parameters.Add("@CreatedBy", createdBy);

        try
        {
            var profile = await connection.QueryFirstAsync<dynamic>(
                "spProfiles_Create",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return profile;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("existe un perfil"))
                throw new InvalidOperationException("Ya existe un perfil con ese nombre");

            throw;
        }
    }

    /// <summary>
    /// Actualizar perfil
    /// </summary>
    public async Task<dynamic> UpdateAsync(int profileId, string name, string? description)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ProfileId", profileId);
        parameters.Add("@Name", name);
        parameters.Add("@Description", description);

        try
        {
            var profile = await connection.QueryFirstAsync<dynamic>(
                "spProfiles_Update",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return profile;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("no encontrado"))
                throw new InvalidOperationException("Perfil no encontrado");
            if (ex.Message.Contains("existe otro perfil"))
                throw new InvalidOperationException("Ya existe otro perfil con ese nombre");

            throw;
        }
    }

    /// <summary>
    /// Eliminar perfil (soft delete)
    /// </summary>
    public async Task<bool> DeleteAsync(int profileId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ProfileId", profileId);

        try
        {
            var result = await connection.QueryFirstAsync<dynamic>(
                "spProfiles_Delete",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result.RowsAffected > 0;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("no encontrado"))
                throw new InvalidOperationException("Perfil no encontrado");
            if (ex.Message.Contains("usuarios asignados"))
                throw new InvalidOperationException("No se puede eliminar el perfil porque tiene usuarios asignados");

            throw;
        }
    }

    /// <summary>
    /// Asignar permisos a un perfil
    /// </summary>
    public async Task<dynamic> AssignPermissionsAsync(int profileId, string permissionsJson, int createdBy)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ProfileId", profileId);
        parameters.Add("@Permissions", permissionsJson);
        parameters.Add("@CreatedBy", createdBy);

        try
        {
            var result = await connection.QueryFirstAsync<dynamic>(
                "spProfiles_AssignPermissions",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("no encontrado"))
                throw new InvalidOperationException("Perfil no encontrado");

            throw;
        }
    }

    /// <summary>
    /// Obtener matriz de permisos para UI
    /// </summary>
    public async Task<(List<dynamic> Modules, List<dynamic> Permissions, List<dynamic>? Assigned)> GetPermissionsMatrixAsync(int? profileId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@ProfileId", profileId);

        using var multi = await connection.QueryMultipleAsync(
            "spProfiles_GetPermissionsMatrix",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        // Primer resultado: módulos
        var modules = (await multi.ReadAsync<dynamic>()).ToList();

        // Segundo resultado: permisos
        var permissions = (await multi.ReadAsync<dynamic>()).ToList();

        // Tercer resultado: asignaciones (solo si profileId != null)
        List<dynamic>? assigned = null;
        if (profileId.HasValue)
        {
            assigned = (await multi.ReadAsync<dynamic>()).ToList();
        }

        return (modules, permissions, assigned);
    }
}