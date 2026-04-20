using Dapper;
using System.Data;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;
using WebApiRoofing.Domain.Enums;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public AuthRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var connection = _connectionFactory.CreateConnection();

        var user = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spAuth_GetByUsername",
            new { Username = username },
            commandType: CommandType.StoredProcedure
        );

        if (user == null)
            return null;

        return MapToUser(user);
    }

    public async Task<User?> GetMeAsync(int userId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var user = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "spAuth_GetMe",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure
        );

        if (user == null)
            return null;

        return MapToUser(user);
    }

    public async Task RevokeTokenAsync(string jti, string token, DateTime expiresAt, int? userId)
    {
        using var connection = _connectionFactory.CreateConnection();

        await connection.ExecuteAsync(
            "spAuth_RevokeToken",
            new
            {
                Jti = jti,
                Token = token,
                ExpiresAt = expiresAt,
                UserId = userId
            },
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task<bool> IsTokenRevokedAsync(string jti)
    {
        using var connection = _connectionFactory.CreateConnection();

        var result = await connection.QueryFirstOrDefaultAsync<bool>(
            "spAuth_IsTokenRevoked",
            new { Jti = jti },
            commandType: CommandType.StoredProcedure
        );

        return result;
    }

    private User MapToUser(dynamic data)
    {
        return new User
        {
            Id = data.Id,
            Username = data.Username,
            Nombre = data.Nombre,
            Email = data.Email,
            Rol = Enum.Parse<UserRole>(data.Rol),
            Avatar = data.Avatar,
            Estado = Enum.Parse<UserStatus>(data.Estado),
            PasswordHash = data.PasswordHash ?? string.Empty,
            CreatedAt = data.CreatedAt
        };
    }
}