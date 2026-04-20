using WebApiRoofing.Domain.Enums;

namespace WebApiRoofing.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Rol { get; set; }
    public string? Avatar { get; set; }
    public UserStatus Estado { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // ===================================
    // Propiedades adicionales para manejo
    // de perfiles y auditoría.
    // No se persisten directamente en dbo.Users
    // — se usan en el repositorio para llamar
    // a spUsers_AssignProfiles.
    // ===================================

    /// <summary>
    /// ID del perfil seleccionado en el formulario (dbo.Profiles).
    /// El repositorio lo usa para insertar en dbo.UserProfiles
    /// y derivar el Rol técnico (Admin/User).
    /// </summary>
    public int? ProfileId { get; set; }

    /// <summary>
    /// ID del usuario que ejecuta la acción (viene del JWT).
    /// Se pasa como AssignedBy a spUsers_AssignProfiles.
    /// </summary>
    public int? CreatedByActorId { get; set; }

    /// <summary>
    /// FK a dbo.Employees — se sincroniza automáticamente al crear/editar el usuario
    /// para que aparezca en los dropdowns de Tasks y Events.
    /// </summary>
    public int? IdEmployee { get; set; }
}