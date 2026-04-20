using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApiRoofing.Application.DTOs.Response;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class ClientRepository : IClientRepository
    {
        private readonly string _connectionString;

        public ClientRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new ArgumentNullException(nameof(configuration));
        }

        // ═══════════════════════════════════════
        //  CRUD - LISTAR TODOS
        // ═══════════════════════════════════════
        public async Task<List<ClientResponse>> GetAllAsync()
        {
            var clients = new List<ClientResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client_GetAll", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            clients.Add(new ClientResponse
                            {
                                IdClient = reader.GetInt32("IdClient"),
                                Name = reader.GetString("Name"),
                                Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                                Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                                Address = reader.GetString("Address"),
                                TypeClient = reader.GetString("TypeClient"),
                                Services = reader.GetString("Services"),
                                Location = reader.GetString("Location"),
                                City = reader.GetString("NombreCity"),
                                State = reader.GetString("State"), // "Active" o "Inactive"
                                CreationDate = reader.GetDateTime("CreationDate"),
                                ModificationDate = reader.GetDateTime("ModificationDate")
                            });
                        }
                    }
                }
            }

            return clients;
        }

        // ═══════════════════════════════════════
        //  CRUD - OBTENER POR ID
        // ═══════════════════════════════════════
        public async Task<ClientDetailResponse?> GetByIdAsync(int id)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client_GetById", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Id", id);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            return new ClientDetailResponse
                            {
                                IdClient = reader.GetInt32("IdClient"),
                                Name = reader.GetString("Name"),
                                Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                                Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                                Address = reader.GetString("Address"),
                                Comments = reader.IsDBNull("Comments") ? null : reader.GetString("Comments"),

                                IdService = reader.GetInt32("IdService"),
                                IdCity = reader.GetInt32("IdCity"),
                                IdLocation = reader.GetInt32("IdTabla"),
                                IdState = reader.GetInt32("IdState"),

                                // Para IdTypeClient, necesitamos hacer join con Service
                                // Por ahora lo dejamos en 0, lo calcularemos en el servicio
                                IdTypeClient = reader.GetInt32("IdTypeClient"),

                                TypeClient = reader.GetString("TypeClient"),
                                Services = reader.GetString("Services"),
                                Location = reader.GetString("Location"),
                                City = reader.GetString("NombreCity"),
                                StateName = reader.GetString("NameState"),

                                State = reader.GetString("State"),
                                CreationDate = reader.GetDateTime("CreationDate"),
                                ModificationDate = reader.GetDateTime("ModificationDate"),

                                AcceptSMS = reader.IsDBNull("AcceptSMS") ? false : reader.GetBoolean("AcceptSMS"),

                                Username = reader.GetString("Username")
                            };
                        }
                    }
                }
            }

            return null;
        }

        // ═══════════════════════════════════════
        //  CRUD - CREAR
        // ═══════════════════════════════════════
        public async Task<int> CreateAsync(Client client)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    var idClientParam = new SqlParameter("@IdClient", SqlDbType.Int)
                    {
                        Direction = ParameterDirection.InputOutput,
                        Value = 0
                    };
                    command.Parameters.Add(idClientParam);

                    command.Parameters.AddWithValue("@IdServices", client.IdService);
                    command.Parameters.AddWithValue("@IdCity", client.IdCity);
                    command.Parameters.AddWithValue("@IdLocation", client.IdLocation);
                    command.Parameters.AddWithValue("@IdUser", client.IdUser);
                    command.Parameters.AddWithValue("@Name", client.Name);
                    command.Parameters.AddWithValue("@Email", (object?)client.Email ?? DBNull.Value);
                    command.Parameters.AddWithValue("@Phone", (object?)client.Phone ?? DBNull.Value);
                    command.Parameters.AddWithValue("@Address", client.Address);
                    command.Parameters.AddWithValue("@Comments", (object?)client.Comments ?? DBNull.Value);
                    command.Parameters.AddWithValue("@State", client.State);
                    command.Parameters.AddWithValue("@CreationDate", client.CreationDate);
                    command.Parameters.AddWithValue("@ModificationDate", client.ModificationDate);
                    command.Parameters.AddWithValue("@TIPO", (byte)1); // 1 = Insert
                    command.Parameters.AddWithValue("@AcceptSMS", client.AcceptSMS);
                    command.Parameters.AddWithValue("@ConsentSMSNote", (object?)client.ConsentSMSNote ?? DBNull.Value);

                    await command.ExecuteNonQueryAsync();

                    return idClientParam.Value != DBNull.Value
                        ? Convert.ToInt32(idClientParam.Value)
                        : 0;
                }
            }
        }

        // ═══════════════════════════════════════
        //  CRUD - ACTUALIZAR
        // ═══════════════════════════════════════
        public async Task<bool> UpdateAsync(Client client)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    command.Parameters.AddWithValue("@IdClient", client.IdClient);
                    command.Parameters.AddWithValue("@IdServices", client.IdService);
                    command.Parameters.AddWithValue("@IdCity", client.IdCity);
                    command.Parameters.AddWithValue("@IdLocation", client.IdLocation);
                    command.Parameters.AddWithValue("@IdUser", client.IdUser);
                    command.Parameters.AddWithValue("@Name", client.Name);
                    command.Parameters.AddWithValue("@Email", (object?)client.Email ?? DBNull.Value);
                    command.Parameters.AddWithValue("@Phone", (object?)client.Phone ?? DBNull.Value);
                    command.Parameters.AddWithValue("@Address", client.Address);
                    command.Parameters.AddWithValue("@Comments", (object?)client.Comments ?? DBNull.Value);
                    command.Parameters.AddWithValue("@State", client.State);
                    command.Parameters.AddWithValue("@CreationDate", client.CreationDate);
                    command.Parameters.AddWithValue("@ModificationDate", client.ModificationDate);
                    command.Parameters.AddWithValue("@TIPO", (byte)2); // 2 = Update
                    command.Parameters.AddWithValue("@AcceptSMS", client.AcceptSMS);
                    command.Parameters.AddWithValue("@ConsentSMSNote", (object?)client.ConsentSMSNote ?? DBNull.Value);

                    var rowsAffected = await command.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }

        // ═══════════════════════════════════════
        //  CRUD - ELIMINAR (SOFT DELETE)
        // ═══════════════════════════════════════
        public async Task<bool> DeleteAsync(int id)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    command.Parameters.AddWithValue("@IdClient", id);
                    command.Parameters.AddWithValue("@IdServices", 0);
                    command.Parameters.AddWithValue("@IdCity", 0);
                    command.Parameters.AddWithValue("@IdLocation", 0);
                    command.Parameters.AddWithValue("@IdUser", 0);
                    command.Parameters.AddWithValue("@Name", "");
                    command.Parameters.AddWithValue("@Email", DBNull.Value);
                    command.Parameters.AddWithValue("@Phone", DBNull.Value);
                    command.Parameters.AddWithValue("@Address", "");
                    command.Parameters.AddWithValue("@Comments", DBNull.Value);
                    command.Parameters.AddWithValue("@State", "0"); // Inactivo
                    command.Parameters.AddWithValue("@CreationDate", DateTime.Parse("1/1/1753 12:00:00"));
                    command.Parameters.AddWithValue("@ModificationDate", DateTime.Parse("1/1/1753 12:00:00"));
                    command.Parameters.AddWithValue("@TIPO", (byte)3); // 3 = Delete
                    command.Parameters.AddWithValue("@AcceptSMS", false);
                    command.Parameters.AddWithValue("@ConsentSMSNote", DBNull.Value);

                    var rowsAffected = await command.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }

        // ═══════════════════════════════════════
        //  CATÁLOGOS - LOCATIONS
        // ═══════════════════════════════════════
        public async Task<List<LocationResponse>> GetLocationsAsync()
        {
            var locations = new List<LocationResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_GetLocationsAsync", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            locations.Add(new LocationResponse
                            {
                                IdTabla = reader.GetInt32("IdTabla"),
                                Description = reader.GetString("Description")
                            });
                        }
                    }
                }
            }

            return locations;
        }

        // ═══════════════════════════════════════
        //  CATÁLOGOS - STATES
        // ═══════════════════════════════════════
        public async Task<List<StateResponse>> GetStatesAsync()
        {
            var states = new List<StateResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_GetStatesAsync", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            states.Add(new StateResponse
                            {
                                IdState = reader.GetInt32("IdState"),
                                NameState = reader.GetString("NameState")
                            });
                        }
                    }
                }
            }

            return states;
        }

        // ═══════════════════════════════════════
        //  CATÁLOGOS - CITIES BY STATE
        // ═══════════════════════════════════════
        public async Task<List<CityResponse>> GetCitiesByStateAsync(int stateId)
        {
            var cities = new List<CityResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_GetCitiesByStateAsync", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Id", stateId);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            cities.Add(new CityResponse
                            {
                                IdCity = reader.GetInt32("IdCity"),
                                NombreCity = reader.GetString("NombreCity"),
                                IdState = reader.GetInt32("IdState"),
                                NameState = reader.GetString("NameState")
                            });
                        }
                    }
                }
            }

            return cities;
        }

        // ═══════════════════════════════════════
        //  CATÁLOGOS - TYPE CLIENTS
        // ═══════════════════════════════════════
        public async Task<List<TypeClientResponse>> GetTypeClientsAsync()
        {
            var types = new List<TypeClientResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_GetTypeClientsAsync", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            types.Add(new TypeClientResponse
                            {
                                IdTypeClient = reader.GetInt32("IdTypeClient"),
                                Name = reader.GetString("Name")
                            });
                        }
                    }
                }
            }

            return types;
        }

        // ═══════════════════════════════════════
        //  CATÁLOGOS - SERVICES BY TYPE CLIENT
        // ═══════════════════════════════════════
        public async Task<List<ServiceResponse>> GetServicesByTypeClientAsync(int typeClientId)
        {
            var services = new List<ServiceResponse>();

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_AyE_Client_GetTypeClients", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Id", typeClientId);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            services.Add(new ServiceResponse
                            {
                                IdService = reader.GetInt32("IdService"),
                                Name = reader.GetString("Name"),
                                IdTypeClient = reader.GetInt32("IdTypeClient"),
                                ClientType = reader.GetString("ClientType"),
                                Price = reader.IsDBNull("Price") ? 0 : reader.GetDecimal("Price"),
                                Descripcion = reader.IsDBNull("Descripcion") ? null : reader.GetString("Descripcion")
                            });
                        }
                    }
                }
            }

            return services;
        }

        // ═══════════════════════════════════════
        //  VALIDACIÓN - CLIENT EXISTS
        // ═══════════════════════════════════════
        public async Task<bool> ClientExistsAsync(string name, int excludeId = 0)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("usp_ClientExistsAsync", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var existingName = reader.GetString("Name").Trim();
                            var existingId = reader.GetInt32("IdClient");

                            if (string.Equals(existingName, name.Trim(), StringComparison.OrdinalIgnoreCase)
                                && existingId != excludeId)
                            {
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
        }
    }
}