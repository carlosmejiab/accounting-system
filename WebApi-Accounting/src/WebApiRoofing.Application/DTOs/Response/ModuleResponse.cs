namespace WebApiRoofing.Application.DTOs.Response;

/// <summary>
/// DTO de respuesta de módulo
/// </summary>
public class ModuleResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentModuleId { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}