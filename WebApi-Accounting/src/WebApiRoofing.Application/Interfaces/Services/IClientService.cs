using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.DTOs.Response;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface IClientService
{
    // CRUD
    Task<ApiResponse<List<ClientResponse>>> GetAllAsync();
    Task<ApiResponse<ClientDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<int>> CreateAsync(CreateClientRequest request, int userId);
    Task<ApiResponse<bool>> UpdateAsync(int id, UpdateClientRequest request, int userId);
    Task<ApiResponse> DeleteAsync(int id);

    // Catálogos
    Task<ApiResponse<List<LocationResponse>>> GetLocationsAsync();
    Task<ApiResponse<List<StateResponse>>> GetStatesAsync();
    Task<ApiResponse<List<CityResponse>>> GetCitiesByStateAsync(int stateId);
    Task<ApiResponse<List<TypeClientResponse>>> GetTypeClientsAsync();
    Task<ApiResponse<List<ServiceResponse>>> GetServicesByTypeClientAsync(int typeClientId);
}