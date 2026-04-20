using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Request;

/// <summary>
/// DTO para actualizar un perfil existente
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// Nombre del perfil
    /// </summary>
    [Required(ErrorMessage = "El nombre del perfil es requerido")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 100 caracteres")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Descripción del perfil
    /// </summary>
    [StringLength(500, ErrorMessage = "La descripción no puede exceder 500 caracteres")]
    public string? Description { get; set; }
}