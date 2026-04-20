namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO para la matriz de permisos (UI)
/// </summary>
public class PermissionsMatrixResponse
{
    /// <summary>
    /// Lista de módulos disponibles
    /// </summary>
    public List<ModuleMatrixItem> Modules { get; set; } = new();

    /// <summary>
    /// Lista de permisos disponibles
    /// </summary>
    public List<PermissionMatrixItem> Permissions { get; set; } = new();

    /// <summary>
    /// Permisos asignados (si se consulta para un perfil específico)
    /// </summary>
    public List<AssignedPermissionItem> AssignedPermissions { get; set; } = new();
}

public class ModuleMatrixItem
{
    public int ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int? ParentModuleId { get; set; }
    public string? ParentCode { get; set; }
    public string? ParentName { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
}

public class PermissionMatrixItem
{
    public int PermissionId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class AssignedPermissionItem
{
    public int ModuleId { get; set; }
    public int PermissionId { get; set; }
}
