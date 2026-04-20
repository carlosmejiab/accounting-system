using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Request;

/// <summary>
/// DTO para asignar permisos a un perfil
/// </summary>
public class AssignPermissionsRequest
{
    /// <summary>
    /// Lista de permisos a asignar
    /// </summary>
    [Required(ErrorMessage = "Debe especificar al menos un permiso")]
    [MinLength(1, ErrorMessage = "Debe especificar al menos un permiso")]
    public List<PermissionAssignment> Permissions { get; set; } = new();
}

/// <summary>
/// Representa un permiso asignado
/// </summary>
public class PermissionAssignment
{
    [Required]
    public int ModuleId { get; set; }

    [Required]
    public int PermissionId { get; set; }
}