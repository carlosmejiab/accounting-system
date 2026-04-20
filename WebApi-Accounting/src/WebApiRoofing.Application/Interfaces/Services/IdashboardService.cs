using WebApiRoofing.Application.DTOs.Dashboard;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
} 