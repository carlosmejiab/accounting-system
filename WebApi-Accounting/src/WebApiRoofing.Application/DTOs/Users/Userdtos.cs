using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Users;

public class UserListItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    // ProfileId para enlazar con dbo.Profiles (opcional)
    public int? ProfileId { get; set; }
    // IdEmployee vinculado en dbo.Employees (sincronizado automáticamente)
    public int? IdEmployee { get; set; }
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "El username es requerido")]
    [StringLength(50, ErrorMessage = "El username no puede exceder 50 caracteres")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es requerido")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El email no es válido")]
    [StringLength(100, ErrorMessage = "El email no puede exceder 100 caracteres")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El password es requerido")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "El password debe tener entre 6 y 100 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es requerido")]
    [RegularExpression("^(Admin|User)$", ErrorMessage = "El rol debe ser Admin o User")]
    public string Rol { get; set; } = "User";

    public string? Avatar { get; set; }

    [Required(ErrorMessage = "El estado es requerido")]
    [RegularExpression("^(Activo|Inactivo)$", ErrorMessage = "El estado debe ser Activo o Inactivo")]
    public string Estado { get; set; } = "Activo";

    // ProfileId opcional (viene del select de Perfiles en el formulario)
    public int? ProfileId { get; set; }
}

public class UpdateUserRequest
{
    [Required(ErrorMessage = "El nombre es requerido")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es requerido")]
    [EmailAddress(ErrorMessage = "El email no es válido")]
    [StringLength(100, ErrorMessage = "El email no puede exceder 100 caracteres")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es requerido")]
    [RegularExpression("^(Admin|User)$", ErrorMessage = "El rol debe ser Admin o User")]
    public string Rol { get; set; } = "User";

    public string? Avatar { get; set; }

    [Required(ErrorMessage = "El estado es requerido")]
    [RegularExpression("^(Activo|Inactivo)$", ErrorMessage = "El estado debe ser Activo o Inactivo")]
    public string Estado { get; set; } = "Activo";

    // ProfileId opcional al actualizar
    public int? ProfileId { get; set; }
}