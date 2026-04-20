using Dapper;
using System.Data;
using WebApiRoofing.Application.DTOs.Dashboard;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

public class AuditRepository : IAuditRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public AuditRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task InsertAsync(int? actorUserId, string action, string entity, int? entityId, string? metadataJson)
    {
        using var connection = _connectionFactory.CreateConnection();

        await connection.ExecuteAsync(
            "spAudit_Insert",
            new
            {
                ActorUserId = actorUserId,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                MetadataJson = metadataJson
            },
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task<List<RecentActionDto>> GetRecentActionsAsync(int topN)
    {
        using var connection = _connectionFactory.CreateConnection();

        var results = await connection.QueryAsync<RecentActionDto>(
            "spAudit_RecentActions",
            new { TopN = topN },
            commandType: CommandType.StoredProcedure
        );

        return results.ToList();
    }
}

public class DashboardRepository : IDashboardRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public DashboardRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<(int TotalUsers, int ProductsCount, decimal SalesTotal, int ReportsCount)> GetSummaryCountsAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var result = await connection.QueryFirstAsync<dynamic>(
            "spDashboard_SummaryCounts",
            commandType: CommandType.StoredProcedure
        );

        return (
            TotalUsers: result.TotalUsers,
            ProductsCount: result.ProductsCount,
            SalesTotal: result.SalesTotal,
            ReportsCount: result.ReportsCount
        );
    }
}