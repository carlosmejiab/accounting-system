using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Users;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface IUserService
{
    /// <summary>
    /// Devuelve los perfiles activos de dbo.Profiles para poblar
    /// el select de "Perfil" en el formulario de usuarios.
    /// Cada item: { value = ProfileId (int), label = Name (string) }
    /// </summary>
    Task<IEnumerable<object>> GetRolesAsync();

    Task<PagedResult<UserListItemDto>> GetUsersAsync(int page, int pageSize, string? search, string? orderBy, string? orderDirection);
    Task<UserListItemDto?> GetUserByIdAsync(int id);
    Task<UserListItemDto> CreateUserAsync(CreateUserRequest request, int actorUserId);
    Task<UserListItemDto> UpdateUserAsync(int id, UpdateUserRequest request, int actorUserId);
    Task<bool> DeleteUserAsync(int id, int actorUserId);
    Task<bool> ExistsUsernameAsync(string username, int? excludeId = null);
    Task<bool> ExistsEmailAsync(string email, int? excludeId = null);
}