using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using WebApiRoofing.Application.Interfaces;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class ContactRepository : IContactRepository
    {
        private readonly string _connectionString;

        public ContactRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        public async Task<IEnumerable<Contact>> GetAllAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Contact>(
                "usp_AyE_Contact_GetAll",
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<Contact?> GetByIdAsync(int idContact)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Contact>(
                "usp_AyE_Contact_GetById",
                new { IdContact = idContact },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<IEnumerable<Contact>> GetByClientAsync(int idClient)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Contact>(
                "usp_AyE_Contact_GetByClient",
                new { IdClient = idClient },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> CreateAsync(Contact contact)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdContact", 0);
            parameters.Add("@IdCity", contact.IdCity);
            parameters.Add("@IdTitles", contact.IdTitles);
            parameters.Add("@IdEmployee", contact.IdEmployee);
            parameters.Add("@IdUser", contact.IdUser);
            parameters.Add("@IdClient", contact.IdClient);
            parameters.Add("@WordAreas", contact.WordAreas);
            parameters.Add("@FirstName", contact.FirstName);
            parameters.Add("@LastName", contact.LastName);
            parameters.Add("@Email", contact.Email);
            parameters.Add("@Phone", contact.Phone);
            parameters.Add("@DateOfBirth", contact.DateOfBirth);
            parameters.Add("@Address", contact.Address);
            parameters.Add("@Description", contact.Description);
            parameters.Add("@State", contact.State);
            parameters.Add("@CreationDate", DateTime.Now);
            parameters.Add("@ModificationDate", DateTime.Now);
            parameters.Add("@TIPO", 1); // Insert

            await connection.ExecuteAsync(
                "usp_AyE_Contact",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // El SP no retorna el ID, necesitamos obtenerlo después
            var result = await connection.QueryFirstOrDefaultAsync<int>(
                "SELECT CAST(SCOPE_IDENTITY() AS INT)"
            );

            return result;
        }

        public async Task<bool> UpdateAsync(Contact contact)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdContact", contact.IdContact);
            parameters.Add("@IdCity", contact.IdCity);
            parameters.Add("@IdTitles", contact.IdTitles);
            parameters.Add("@IdEmployee", contact.IdEmployee);
            parameters.Add("@IdUser", contact.IdUser);
            parameters.Add("@IdClient", contact.IdClient);
            parameters.Add("@WordAreas", contact.WordAreas);
            parameters.Add("@FirstName", contact.FirstName);
            parameters.Add("@LastName", contact.LastName);
            parameters.Add("@Email", contact.Email);
            parameters.Add("@Phone", contact.Phone);
            parameters.Add("@DateOfBirth", contact.DateOfBirth);
            parameters.Add("@Address", contact.Address);
            parameters.Add("@Description", contact.Description);
            parameters.Add("@State", contact.State);
            parameters.Add("@CreationDate", contact.CreationDate);
            parameters.Add("@ModificationDate", DateTime.Now);
            parameters.Add("@TIPO", 2); // Update

            var result = await connection.ExecuteAsync(
                "usp_AyE_Contact",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result > 0;
        }

        public async Task<bool> DeleteAsync(int idContact)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@IdContact", idContact);
            parameters.Add("@IdCity", 0);
            parameters.Add("@IdTitles", 0);
            parameters.Add("@IdEmployee", 0);
            parameters.Add("@IdUser", 0);
            parameters.Add("@IdClient", 0);
            parameters.Add("@WordAreas", "");
            parameters.Add("@FirstName", "");
            parameters.Add("@LastName", "");
            parameters.Add("@Email", "");
            parameters.Add("@Phone", "");
            parameters.Add("@DateOfBirth", DBNull.Value);
            parameters.Add("@Address", "");
            parameters.Add("@Description", "");
            parameters.Add("@State", '0');
            parameters.Add("@CreationDate", DBNull.Value);
            parameters.Add("@ModificationDate", DBNull.Value);
            parameters.Add("@TIPO", 3); // Delete

            var result = await connection.ExecuteAsync(
                "usp_AyE_Contact",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result > 0;
        }
    }
}