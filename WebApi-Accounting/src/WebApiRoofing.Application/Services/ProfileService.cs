using System.Text.Json;
using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.DTOs.Response;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IProfileRepository _profileRepository;
    private readonly IModuleRepository _moduleRepository;
    private readonly IPermissionRepository _permissionRepository;
    private readonly IAuditRepository _auditRepository;

    public ProfileService(
        IProfileRepository profileRepository,
        IModuleRepository moduleRepository,
        IPermissionRepository permissionRepository,
        IAuditRepository auditRepository)
    {
        _profileRepository = profileRepository;
        _moduleRepository = moduleRepository;
        _permissionRepository = permissionRepository;
        _auditRepository = auditRepository;
    }

    public async Task<ApiResponse<List<ProfileResponse>>> GetAllAsync()
    {
        try
        {
            var profiles = await _profileRepository.GetAllAsync();

            var result = profiles.Select(p => new ProfileResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                UsersCount = p.UsersCount,
                ModulesCount = p.ModulesCount,
                PermissionsCount = p.PermissionsCount
            }).ToList();

            return new ApiResponse<List<ProfileResponse>>
            {
                Success = true,
                Message = "Perfiles obtenidos exitosamente",
                Data = result
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ProfileResponse>>
            {
                Success = false,
                Message = $"Error al obtener perfiles: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<ProfileDetailResponse>> GetByIdAsync(int profileId)
    {
        try
        {
            var (profile, permissions, users) = await _profileRepository.GetByIdAsync(profileId);

            if (profile == null)
            {
                return new ApiResponse<ProfileDetailResponse>
                {
                    Success = false,
                    Message = "Perfil no encontrado",
                    Data = null
                };
            }

            var result = new ProfileDetailResponse
            {
                Id = profile.Id,
                Name = profile.Name,
                Description = profile.Description,
                IsActive = profile.IsActive,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt,
                Permissions = permissions.Select(p => new ProfilePermissionResponse
                {
                    Id = p.Id,
                    ModuleId = p.ModuleId,
                    ModuleCode = p.ModuleCode,
                    ModuleName = p.ModuleName,
                    ParentModuleId = p.ParentModuleId,
                    PermissionId = p.PermissionId,
                    PermissionCode = p.PermissionCode,
                    PermissionName = p.PermissionName,
                    PermissionCategory = p.PermissionCategory,
                    IsGranted = p.IsGranted
                }).ToList(),
                Users = users.Select(u => new ProfileUserResponse
                {
                    Id = u.Id,
                    Username = u.Username,
                    Nombre = u.Nombre,
                    Email = u.Email,
                    AssignedAt = u.AssignedAt
                }).ToList()
            };

            return new ApiResponse<ProfileDetailResponse>
            {
                Success = true,
                Message = "Perfil encontrado",
                Data = result
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProfileDetailResponse>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<ProfileResponse>> CreateAsync(CreateProfileRequest request, int createdBy)
    {
        try
        {
            var profile = await _profileRepository.CreateAsync(request.Name, request.Description, createdBy);

            await _auditRepository.InsertAsync(
                createdBy,
                "CREATE_PROFILE",
                "Profiles",
                (int)profile.Id,
                $"{{\"name\":\"{profile.Name}\"}}"
            );

            return new ApiResponse<ProfileResponse>
            {
                Success = true,
                Message = "Perfil creado exitosamente",
                Data = new ProfileResponse
                {
                    Id = profile.Id,
                    Name = profile.Name,
                    Description = profile.Description,
                    IsActive = profile.IsActive,
                    CreatedAt = profile.CreatedAt
                }
            };
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse<ProfileResponse>
            {
                Success = false,
                Message = ex.Message,
                Data = null
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProfileResponse>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<ProfileResponse>> UpdateAsync(int profileId, UpdateProfileRequest request)
    {
        try
        {
            var profile = await _profileRepository.UpdateAsync(profileId, request.Name, request.Description);

            return new ApiResponse<ProfileResponse>
            {
                Success = true,
                Message = "Perfil actualizado exitosamente",
                Data = new ProfileResponse
                {
                    Id = profile.Id,
                    Name = profile.Name,
                    Description = profile.Description,
                    IsActive = profile.IsActive,
                    CreatedAt = profile.CreatedAt,
                    UpdatedAt = profile.UpdatedAt
                }
            };
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse<ProfileResponse> { Success = false, Message = ex.Message, Data = null };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ProfileResponse> { Success = false, Message = $"Error: {ex.Message}", Data = null };
        }
    }

    public async Task<ApiResponse> DeleteAsync(int profileId)
    {
        try
        {
            await _profileRepository.DeleteAsync(profileId);
            return new ApiResponse { Success = true, Message = "Perfil eliminado exitosamente" };
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse { Success = false, Message = ex.Message };
        }
        catch (Exception ex)
        {
            return new ApiResponse { Success = false, Message = $"Error: {ex.Message}" };
        }
    }

    public async Task<ApiResponse> AssignPermissionsAsync(int profileId, AssignPermissionsRequest request, int createdBy)
    {
        try
        {
            var json = JsonSerializer.Serialize(request.Permissions.Select(p => new { p.ModuleId, p.PermissionId }));
            await _profileRepository.AssignPermissionsAsync(profileId, json, createdBy);

            return new ApiResponse { Success = true, Message = "Permisos asignados exitosamente" };
        }
        catch (Exception ex)
        {
            return new ApiResponse { Success = false, Message = $"Error: {ex.Message}" };
        }
    }

    public async Task<ApiResponse<PermissionsMatrixResponse>> GetPermissionsMatrixAsync(int? profileId)
    {
        try
        {
            var (modules, permissions, assigned) = await _profileRepository.GetPermissionsMatrixAsync(profileId);

            var result = new PermissionsMatrixResponse
            {
                Modules = modules.Select(m => new ModuleMatrixItem
                {
                    ModuleId = m.ModuleId,
                    ModuleCode = m.ModuleCode,
                    ModuleName = m.ModuleName,
                    ParentModuleId = m.ParentModuleId,
                    ParentCode = m.ParentCode,
                    ParentName = m.ParentName,
                    Icon = m.Icon,
                    DisplayOrder = m.DisplayOrder
                }).ToList(),
                Permissions = permissions.Select(p => new PermissionMatrixItem
                {
                    PermissionId = p.PermissionId,
                    PermissionCode = p.PermissionCode,
                    PermissionName = p.PermissionName,
                    Category = p.Category
                }).ToList(),
                AssignedPermissions = assigned?.Select(a => new AssignedPermissionItem
                {
                    ModuleId = a.ModuleId,
                    PermissionId = a.PermissionId
                }).ToList() ?? new()
            };

            return new ApiResponse<PermissionsMatrixResponse> { Success = true, Data = result };
        }
        catch (Exception ex)
        {
            return new ApiResponse<PermissionsMatrixResponse> { Success = false, Message = $"Error: {ex.Message}", Data = null };
        }
    }

    public async Task<ApiResponse<UserEffectivePermissionsResponse>> GetUserPermissionsAsync(int userId)
    {
        try
        {
            var (profiles, permissions) = await _permissionRepository.GetUserEffectivePermissionsAsync(userId);

            var result = new UserEffectivePermissionsResponse
            {
                Profiles = profiles.Select(p => new UserProfileItem
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description
                }).ToList(),
                Permissions = permissions.Select(p => new EffectivePermissionItem
                {
                    ModuleCode = p.ModuleCode,
                    ModuleName = p.ModuleName,
                    PermissionCode = p.PermissionCode,
                    PermissionName = p.PermissionName
                }).ToList()
            };

            return new ApiResponse<UserEffectivePermissionsResponse> { Success = true, Data = result };
        }
        catch (Exception ex)
        {
            return new ApiResponse<UserEffectivePermissionsResponse> { Success = false, Message = $"Error: {ex.Message}", Data = null };
        }
    }

    public async Task<ApiResponse> AssignProfilesToUserAsync(int userId, AssignProfilesToUserRequest request, int assignedBy)
    {
        try
        {
            var json = JsonSerializer.Serialize(request.ProfileIds);
            await _permissionRepository.AssignProfilesToUserAsync(userId, json, assignedBy);

            return new ApiResponse { Success = true, Message = "Perfiles asignados exitosamente" };
        }
        catch (Exception ex)
        {
            return new ApiResponse { Success = false, Message = $"Error: {ex.Message}" };
        }
    }
}
