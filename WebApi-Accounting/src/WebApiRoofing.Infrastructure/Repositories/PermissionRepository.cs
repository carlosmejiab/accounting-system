using Dapper;
using System.Data;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

/// <summary>
/// Repositorio de permisos usando Dapper
/// </summary>
public class PermissionRepository : IPermissionRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PermissionRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// Obtener todos los permisos
    /// </summary>
    public async Task<List<dynamic>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var permissions = await connection.QueryAsync<dynamic>(
            "spPermissions_GetAll",
            commandType: CommandType.StoredProcedure
        );

        return permissions.ToList();
    }

    /// <summary>
    /// Obtener permisos efectivos de un usuario
    /// </summary>
    public async Task<(List<dynamic> Profiles, List<dynamic> Permissions)> GetUserEffectivePermissionsAsync(int userId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@UserId", userId);

        using var multi = await connection.QueryMultipleAsync(
            "spUsers_GetEffectivePermissions",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        // Primer resultado: perfiles del usuario
        var profiles = (await multi.ReadAsync<dynamic>()).ToList();

        // Segundo resultado: permisos efectivos
        var permissions = (await multi.ReadAsync<dynamic>()).ToList();

        return (profiles, permissions);
    }

    /// <summary>
    /// Verificar si un usuario tiene un permiso específico
    /// </summary>
    public async Task<bool> UserHasPermissionAsync(int userId, string moduleCode, string permissionCode)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@UserId", userId);
        parameters.Add("@ModuleCode", moduleCode);
        parameters.Add("@PermissionCode", permissionCode);

        var result = await connection.QueryFirstAsync<dynamic>(
            "spUsers_HasPermission",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        return result.HasPermission;
    }

    /// <summary>
    /// Asignar perfiles a un usuario
    /// </summary>
    public async Task<dynamic> AssignProfilesToUserAsync(int userId, string profileIdsJson, int assignedBy)
    {
        using var connection = _connectionFactory.CreateConnection();

        var parameters = new DynamicParameters();
        parameters.Add("@UserId", userId);
        parameters.Add("@ProfileIds", profileIdsJson);
        parameters.Add("@AssignedBy", assignedBy);

        try
        {
            var result = await connection.QueryFirstAsync<dynamic>(
                "spUsers_AssignProfiles",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }
        catch (Exception ex)
        {
            if (ex.Message.Contains("no encontrado"))
                throw new InvalidOperationException("Usuario no encontrado");

            throw;
        }
    }
}