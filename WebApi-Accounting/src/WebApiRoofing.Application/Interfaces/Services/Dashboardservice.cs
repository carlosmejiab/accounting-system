using WebApiRoofing.Application.DTOs.Dashboard;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly IAuditRepository _auditRepository;

    public DashboardService(
        IDashboardRepository dashboardRepository,
        IAuditRepository auditRepository)
    {
        _dashboardRepository = dashboardRepository;
        _auditRepository = auditRepository;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var counts = await _dashboardRepository.GetSummaryCountsAsync();
        var recentActions = await _auditRepository.GetRecentActionsAsync(10);

        return new DashboardSummaryDto
        {
            TotalUsers = counts.TotalUsers,
            ProductsCount = counts.ProductsCount,
            SalesTotal = counts.SalesTotal,
            ReportsCount = counts.ReportsCount,
            RecentActions = recentActions
        };
    }
}