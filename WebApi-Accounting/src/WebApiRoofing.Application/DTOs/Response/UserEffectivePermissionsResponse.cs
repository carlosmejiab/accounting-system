namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO de permisos efectivos de un usuario
/// </summary>
public class UserEffectivePermissionsResponse
{
    /// <summary>
    /// Perfiles asignados al usuario
    /// </summary>
    public List<UserProfileItem> Profiles { get; set; } = new();

    /// <summary>
    /// Permisos efectivos (consolidados de todos los perfiles)
    /// </summary>
    public List<EffectivePermissionItem> Permissions { get; set; } = new();
}

public class UserProfileItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class EffectivePermissionItem
{
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
}