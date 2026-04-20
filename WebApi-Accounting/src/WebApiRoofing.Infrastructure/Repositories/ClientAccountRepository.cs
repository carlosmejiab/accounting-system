using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using WebApiRoofing.Application.DTOs.ClientAccount;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class ClientAccountRepository : IClientAccountRepository
    {
        private readonly string _connectionString;

        public ClientAccountRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<IEnumerable<ClientAccount>> GetAllAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<ClientAccount>(
                "usp_AyE_ClientAccount_GetAll",
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<ClientAccount?> GetByIdAsync(int idClientAccount)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<ClientAccount>(
                "usp_AyE_ClientAccount_GetById",
                new { IdClientAccount = idClientAccount },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<IEnumerable<ClientAccount>> GetByClientAsync(int idClient)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<ClientAccount>(
                "usp_AyE_ClientAccount_GetByClient",
                new { IdClient = idClient },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> CreateAsync(ClientAccount clientAccount)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdClientAccount", 0);
            parameters.Add("@IdClient", clientAccount.IdClient);
            parameters.Add("@IdBank", clientAccount.IdBank);
            parameters.Add("@AccountNumber", clientAccount.AccountNumber);
            parameters.Add("@State", clientAccount.State);
            parameters.Add("@IdUser", clientAccount.IdUser);
            parameters.Add("@TIPO", 1); // Insert

            await connection.ExecuteAsync(
                "usp_AyE_ClientAccount",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // El SP no retorna el ID, necesitamos obtenerlo después
            var result = await connection.QueryFirstOrDefaultAsync<int>(
                "SELECT CAST(SCOPE_IDENTITY() AS INT)"
            );

            return result;
        }

        public async Task<bool> UpdateAsync(ClientAccount clientAccount)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdClientAccount", clientAccount.IdClientAccount);
            parameters.Add("@IdClient", clientAccount.IdClient);
            parameters.Add("@IdBank", clientAccount.IdBank);
            parameters.Add("@AccountNumber", clientAccount.AccountNumber);
            parameters.Add("@State", clientAccount.State);
            parameters.Add("@IdUser", clientAccount.IdUser);
            parameters.Add("@TIPO", 2); // Update

            var result = await connection.ExecuteAsync(
                "usp_AyE_ClientAccount",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result > 0;
        }

        public async Task<bool> DeleteAsync(int idClientAccount)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdClientAccount", idClientAccount);
            parameters.Add("@IdClient", 0);
            parameters.Add("@IdBank", 0);
            parameters.Add("@AccountNumber", "");
            parameters.Add("@State", '0');
            parameters.Add("@IdUser", 0);
            parameters.Add("@TIPO", 3); // Delete

            var result = await connection.ExecuteAsync(
                "usp_AyE_ClientAccount",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result > 0;
        }

        public async Task<IEnumerable<BankCatalogDto>> GetBanksAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<BankCatalogDto>(
                "usp_AyE_Listar_Tablas_Todo",
                new { TIPO = "MBank" },
                commandType: CommandType.StoredProcedure
            );
        }
    }
}