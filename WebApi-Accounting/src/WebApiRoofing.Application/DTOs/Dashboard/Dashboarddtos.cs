namespace WebApiRoofing.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TotalUsers { get; set; }
    public int ProductsCount { get; set; }
    public decimal SalesTotal { get; set; }
    public int ReportsCount { get; set; }
    public List<RecentActionDto> RecentActions { get; set; } = new();
}

public class RecentActionDto
{
    public int Id { get; set; }
    public int? ActorUserId { get; set; }
    public string? ActorUsername { get; set; }
    public string? ActorNombre { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; }
}