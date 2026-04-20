namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO de respuesta de permiso
/// </summary>
public class PermissionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
}