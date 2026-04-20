namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO de respuesta básica de perfil
/// </summary>
public class ProfileResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Estadísticas
    public int UsersCount { get; set; }
    public int ModulesCount { get; set; }
    public int PermissionsCount { get; set; }
}