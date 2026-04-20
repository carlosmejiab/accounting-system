using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories;

/// <summary>
/// Interface del repositorio de perfiles
/// </summary>
public interface IProfileRepository
{
    Task<List<dynamic>> GetAllAsync();
    Task<(dynamic? Profile, List<dynamic> Permissions, List<dynamic> Users)> GetByIdAsync(int profileId);
    Task<dynamic> CreateAsync(string name, string? description, int createdBy);
    Task<dynamic> UpdateAsync(int profileId, string name, string? description);
    Task<bool> DeleteAsync(int profileId);
    Task<dynamic> AssignPermissionsAsync(int profileId, string permissionsJson, int createdBy);
    Task<(List<dynamic> Modules, List<dynamic> Permissions, List<dynamic>? Assigned)> GetPermissionsMatrixAsync(int? profileId);
}