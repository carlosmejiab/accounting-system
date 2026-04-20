using WebApiRoofing.Application.DTOs.Dashboard;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories;

public interface IAuthRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetMeAsync(int userId);
    Task RevokeTokenAsync(string jti, string token, DateTime expiresAt, int? userId);
    Task<bool> IsTokenRevokedAsync(string jti);
}

public interface IUserRepository
{
    Task<IEnumerable<object>> GetRolesAsync();
    Task<(List<User> Items, int Total)> GetUsersAsync(int page, int pageSize, string? search, string? orderBy, string? orderDirection);
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User> CreateAsync(User user);
    Task<User?> UpdateAsync(User user);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsUsernameAsync(string username, int? excludeId);
    Task<bool> ExistsEmailAsync(string email, int? excludeId);
}

public interface IAuditRepository
{
    Task InsertAsync(int? actorUserId, string action, string entity, int? entityId, string? metadataJson);
    Task<List<RecentActionDto>> GetRecentActionsAsync(int topN);
}

public interface IDashboardRepository
{
    Task<(int TotalUsers, int ProductsCount, decimal SalesTotal, int ReportsCount)> GetSummaryCountsAsync();
}