using System.Collections.Generic;
using System.Threading.Tasks;
using WebApiRoofing.Application.DTOs.Response;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IClientRepository
    {
        // CRUD básico
        Task<List<ClientResponse>> GetAllAsync();
        Task<ClientDetailResponse?> GetByIdAsync(int id);
        Task<int> CreateAsync(Client client);
        Task<bool> UpdateAsync(Client client);
        Task<bool> DeleteAsync(int id);

        // Catálogos (dropdowns)
        Task<List<LocationResponse>> GetLocationsAsync();
        Task<List<StateResponse>> GetStatesAsync();
        Task<List<CityResponse>> GetCitiesByStateAsync(int stateId);
        Task<List<TypeClientResponse>> GetTypeClientsAsync();
        Task<List<ServiceResponse>> GetServicesByTypeClientAsync(int typeClientId);

        // Validaciones
        Task<bool> ClientExistsAsync(string name, int excludeId = 0);
    }
}