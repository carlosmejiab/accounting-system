namespace WebApiRoofing.Application.Interfaces.Repositories;

/// <summary>
/// Interface del repositorio de permisos
/// </summary>
public interface IPermissionRepository
{
    Task<List<dynamic>> GetAllAsync();
    Task<(List<dynamic> Profiles, List<dynamic> Permissions)> GetUserEffectivePermissionsAsync(int userId);
    Task<bool> UserHasPermissionAsync(int userId, string moduleCode, string permissionCode);
    Task<dynamic> AssignProfilesToUserAsync(int userId, string profileIdsJson, int assignedBy);
}