using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Request;

/// <summary>
/// DTO para asignar perfiles a un usuario
/// </summary>
public class AssignProfilesToUserRequest
{
    /// <summary>
    /// IDs de los perfiles a asignar
    /// </summary>
    [Required(ErrorMessage = "Debe especificar al menos un perfil")]
    [MinLength(1, ErrorMessage = "Debe especificar al menos un perfil")]
    public List<int> ProfileIds { get; set; } = new();
}