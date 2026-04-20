using Dapper;
using System.Data;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Infrastructure.Data;

namespace WebApiRoofing.Infrastructure.Repositories;

/// <summary>
/// Repositorio de módulos usando Dapper
/// </summary>
public class ModuleRepository : IModuleRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ModuleRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// Obtener todos los módulos
    /// </summary>
    public async Task<List<dynamic>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        var modules = await connection.QueryAsync<dynamic>(
            "spModules_GetAll",
            commandType: CommandType.StoredProcedure
        );

        return modules.ToList();
    }
}