namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO de respuesta detallada de perfil con permisos y usuarios
/// </summary>
public class ProfileDetailResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Permisos asignados al perfil
    /// </summary>
    public List<ProfilePermissionResponse> Permissions { get; set; } = new();

    /// <summary>
    /// Usuarios asignados al perfil
    /// </summary>
    public List<ProfileUserResponse> Users { get; set; } = new();
}

public class ProfilePermissionResponse
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int? ParentModuleId { get; set; }
    public int PermissionId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string PermissionCategory { get; set; } = string.Empty;
    public bool IsGranted { get; set; }
}

public class ProfileUserResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}