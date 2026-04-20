using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.DTOs.Response;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface IProfileService
{
    Task<ApiResponse<List<ProfileResponse>>> GetAllAsync();
    Task<ApiResponse<ProfileDetailResponse>> GetByIdAsync(int profileId);
    Task<ApiResponse<ProfileResponse>> CreateAsync(CreateProfileRequest request, int createdBy);
    Task<ApiResponse<ProfileResponse>> UpdateAsync(int profileId, UpdateProfileRequest request);
    Task<ApiResponse> DeleteAsync(int profileId);
    Task<ApiResponse> AssignPermissionsAsync(int profileId, AssignPermissionsRequest request, int createdBy);
    Task<ApiResponse<PermissionsMatrixResponse>> GetPermissionsMatrixAsync(int? profileId);
    Task<ApiResponse<UserEffectivePermissionsResponse>> GetUserPermissionsAsync(int userId);
    Task<ApiResponse> AssignProfilesToUserAsync(int userId, AssignProfilesToUserRequest request, int assignedBy);
}