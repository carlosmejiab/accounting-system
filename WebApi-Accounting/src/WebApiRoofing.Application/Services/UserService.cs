using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Users;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;
using WebApiRoofing.Domain.Enums;

namespace WebApiRoofing.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditRepository _auditRepository;

    public UserService(IUserRepository userRepository, IAuditRepository auditRepository)
    {
        _userRepository = userRepository;
        _auditRepository = auditRepository;
    }

    // ===================================
    // GET ROLES � delega al repositorio
    // que llama a spUsers_GetRoles
    // Devuelve perfiles activos de dbo.Profiles
    // ===================================
    public async Task<IEnumerable<object>> GetRolesAsync()
    {
        return await _userRepository.GetRolesAsync();
    }

    // ===================================
    // GET ALL
    // ===================================
    public async Task<PagedResult<UserListItemDto>> GetUsersAsync(
        int page, int pageSize, string? search, string? orderBy, string? orderDirection)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var (items, total) = await _userRepository.GetUsersAsync(page, pageSize, search, orderBy, orderDirection);

        return new PagedResult<UserListItemDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total
        };
    }

    // ===================================
    // GET BY ID
    // ===================================
    public async Task<UserListItemDto?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : MapToDto(user);
    }

    // ===================================
    // CREATE
    // Ahora acepta ProfileId desde el request.
    // El repositorio deriva Rol t�cnico (Admin/User)
    // seg�n el nombre del perfil y asigna UserProfiles.
    // ===================================
    public async Task<UserListItemDto> CreateUserAsync(CreateUserRequest request, int actorUserId)
    {
        // Verificar duplicados
        if (await _userRepository.ExistsUsernameAsync(request.Username, null))
            throw new InvalidOperationException("USERNAME_ALREADY_EXISTS");

        if (await _userRepository.ExistsEmailAsync(request.Email, null))
            throw new InvalidOperationException("EMAIL_ALREADY_EXISTS");

        // Hash de contrase�a
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 11);

        var user = new User
        {
            Username = request.Username,
            Nombre = request.Nombre,
            Email = request.Email,
            Avatar = request.Avatar,
            PasswordHash = passwordHash,
            // Rol y Estado por defecto � el repositorio los ajusta
            // seg�n el perfil seleccionado via spUsers_GetRoles
            Rol = UserRole.User,
            Estado = UserStatus.Activo,
            CreatedAt = DateTime.UtcNow,
            // Perfil seleccionado en el formulario (viene de dbo.Profiles)
            ProfileId = request.ProfileId,
            CreatedByActorId = actorUserId
        };

        var created = await _userRepository.CreateAsync(user);

        await _auditRepository.InsertAsync(actorUserId, "CREATE_USER", "User", created.Id, null);

        return MapToDto(created);
    }

    // ===================================
    // UPDATE
    // Si el request incluye ProfileId, el repositorio
    // reasigna el perfil en dbo.UserProfiles y
    // actualiza el Rol t�cnico en dbo.Users.
    // ===================================
    public async Task<UserListItemDto> UpdateUserAsync(int id, UpdateUserRequest request, int actorUserId)
    {
        var existing = await _userRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException("USER_NOT_FOUND");

        if (await _userRepository.ExistsEmailAsync(request.Email, id))
            throw new InvalidOperationException("EMAIL_ALREADY_EXISTS");

        var userToUpdate = new User
        {
            Id = id,
            Nombre = request.Nombre,
            Email = request.Email,
            Avatar = request.Avatar,
            // Mantener el Rol actual � el repositorio lo sobreescribe
            // si viene un ProfileId nuevo
            Rol = existing.Rol,
            Estado = existing.Estado,
            // Perfil nuevo (opcional) � si viene, se reasigna
            ProfileId = request.ProfileId,
            CreatedByActorId = actorUserId
        };

        var updated = await _userRepository.UpdateAsync(userToUpdate);
        if (updated == null)
            throw new InvalidOperationException("USER_NOT_FOUND");

        await _auditRepository.InsertAsync(actorUserId, "UPDATE_USER", "User", updated.Id, null);

        return MapToDto(updated);
    }

    // ===================================
    // DELETE
    // ===================================
    public async Task<bool> DeleteUserAsync(int id, int actorUserId)
    {
        var existing = await _userRepository.GetByIdAsync(id);
        if (existing == null)
            throw new KeyNotFoundException("USER_NOT_FOUND");

        var deleted = await _userRepository.DeleteAsync(id);
        if (deleted)
            await _auditRepository.InsertAsync(actorUserId, "DELETE_USER", "User", id, null);

        return deleted;
    }

    public Task<bool> ExistsUsernameAsync(string username, int? excludeId = null)
        => _userRepository.ExistsUsernameAsync(username, excludeId);

    public Task<bool> ExistsEmailAsync(string email, int? excludeId = null)
        => _userRepository.ExistsEmailAsync(email, excludeId);

    // ===================================
    // MAPPER
    // ===================================
    private static UserListItemDto MapToDto(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Nombre = u.Nombre,
        Email = u.Email,
        Rol = u.Rol.ToString(),
        Avatar = u.Avatar,
        Estado = u.Estado.ToString(),
        CreatedAt  = u.CreatedAt,
        IdEmployee = u.IdEmployee,
        ProfileId = u.ProfileId
    };
}