using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.DTOs.Response;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Services;

public class ClientService : IClientService
{
    private readonly IClientRepository _clientRepository;

    public ClientService(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository;
    }

    // ═══════════════════════════════════════
    //  GET ALL CLIENTS
    // ═══════════════════════════════════════
    public async Task<ApiResponse<List<ClientResponse>>> GetAllAsync()
    {
        try
        {
            var clients = await _clientRepository.GetAllAsync();

            return new ApiResponse<List<ClientResponse>>
            {
                Success = true,
                Message = "Clientes obtenidos exitosamente",
                Data = clients
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ClientResponse>>
            {
                Success = false,
                Message = $"Error al obtener clientes: {ex.Message}",
                Data = null
            };
        }
    }

    // ═══════════════════════════════════════
    //  GET CLIENT BY ID
    // ═══════════════════════════════════════
    public async Task<ApiResponse<ClientDetailResponse>> GetByIdAsync(int id)
    {
        try
        {
            if (id <= 0)
            {
                return new ApiResponse<ClientDetailResponse>
                {
                    Success = false,
                    Message = "ID de cliente inválido",
                    Data = null
                };
            }

            var client = await _clientRepository.GetByIdAsync(id);

            if (client == null)
            {
                return new ApiResponse<ClientDetailResponse>
                {
                    Success = false,
                    Message = "Cliente no encontrado",
                    Data = null
                };
            }

            // Obtener IdTypeClient desde el servicio
            var allServices = await _clientRepository.GetServicesByTypeClientAsync(client.IdTypeClient);
            var service = allServices.Find(s => s.IdService == client.IdService);

            if (service != null)
                client.IdTypeClient = service.IdTypeClient;

            return new ApiResponse<ClientDetailResponse>
            {
                Success = true,
                Message = "Cliente encontrado",
                Data = client
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<ClientDetailResponse>
            {
                Success = false,
                Message = $"Error al obtener cliente: {ex.Message}",
                Data = null
            };
        }
    }

    // ═══════════════════════════════════════
    //  CREATE CLIENT
    // ═══════════════════════════════════════
    public async Task<ApiResponse<int>> CreateAsync(CreateClientRequest request, int userId)
    {
        try
        {
            // Validaciones
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "El nombre del cliente es requerido",
                    Data = 0
                };
            }

            if (string.IsNullOrWhiteSpace(request.Address))
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "La dirección es requerida",
                    Data = 0
                };
            }

            // Validar email si se proporciona
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                if (!IsValidEmail(request.Email))
                {
                    return new ApiResponse<int>
                    {
                        Success = false,
                        Message = "Formato de email inválido",
                        Data = 0
                    };
                }
            }

            // Validar teléfono si AcceptSMS está activado
            if (request.AcceptSMS && string.IsNullOrWhiteSpace(request.Phone))
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = "El teléfono es requerido cuando se acepta SMS",
                    Data = 0
                };
            }

            // Verificar si el cliente ya existe
            var exists = await _clientRepository.ClientExistsAsync(request.Name);
            if (exists)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = $"Ya existe un cliente con el nombre '{request.Name}'",
                    Data = 0
                };
            }

            // Crear entidad
            var client = new Client
            {
                IdService = request.IdService,
                IdCity = request.IdCity,
                IdLocation = request.IdLocation,
                IdUser = userId,
                Name = request.Name.Trim(),
                Email = request.Email?.Trim(),
                Phone = request.Phone?.Trim(),
                Address = request.Address.Trim(),
                Comments = request.Comments?.Trim(),
                State = request.IsActive ? "1" : "0",
                AcceptSMS = request.AcceptSMS,
                CreationDate = DateTime.Now,
                ModificationDate = DateTime.Now
            };

            // Generar nota de consentimiento SMS
            if (client.AcceptSMS)
            {
                client.ConsentSMSNote = $"Client gave consent on {DateTime.Now:yyyy-MM-dd HH:mm} by user ID {userId}";
            }

            // Guardar
            var clientId = await _clientRepository.CreateAsync(client);

            if (clientId > 0)
            {
                return new ApiResponse<int>
                {
                    Success = true,
                    Message = "Cliente creado exitosamente",
                    Data = clientId
                };
            }

            return new ApiResponse<int>
            {
                Success = false,
                Message = "Error al crear el cliente",
                Data = 0
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<int>
            {
                Success = false,
                Message = $"Error al crear cliente: {ex.Message}",
                Data = 0
            };
        }
    }

    // ═══════════════════════════════════════
    //  UPDATE CLIENT
    // ═══════════════════════════════════════
    public async Task<ApiResponse<bool>> UpdateAsync(int id, UpdateClientRequest request, int userId)
    {
        try
        {
            // Validaciones
            if (id <= 0)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "ID de cliente inválido",
                    Data = false
                };
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "El nombre del cliente es requerido",
                    Data = false
                };
            }

            if (string.IsNullOrWhiteSpace(request.Address))
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "La dirección es requerida",
                    Data = false
                };
            }

            // Validar email si se proporciona
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                if (!IsValidEmail(request.Email))
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Formato de email inválido",
                        Data = false
                    };
                }
            }

            // Validar teléfono si AcceptSMS está activado
            if (request.AcceptSMS && string.IsNullOrWhiteSpace(request.Phone))
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "El teléfono es requerido cuando se acepta SMS",
                    Data = false
                };
            }

            // Verificar si existe otro cliente con el mismo nombre
            var exists = await _clientRepository.ClientExistsAsync(request.Name, id);
            if (exists)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Ya existe otro cliente con el nombre '{request.Name}'",
                    Data = false
                };
            }

            // Obtener cliente existente para preservar CreationDate
            var existingClient = await _clientRepository.GetByIdAsync(id);
            if (existingClient == null)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Cliente no encontrado",
                    Data = false
                };
            }

            // Crear entidad actualizada
            var client = new Client
            {
                IdClient = id,
                IdService = request.IdService,
                IdCity = request.IdCity,
                IdLocation = request.IdLocation,
                IdUser = userId,
                Name = request.Name.Trim(),
                Email = request.Email?.Trim(),
                Phone = request.Phone?.Trim(),
                Address = request.Address.Trim(),
                Comments = request.Comments?.Trim(),
                State = request.IsActive ? "1" : "0",
                AcceptSMS = request.AcceptSMS,
                CreationDate = existingClient.CreationDate,
                ModificationDate = DateTime.Now
            };

            // Actualizar nota de consentimiento SMS
            if (client.AcceptSMS)
            {
                client.ConsentSMSNote = $"Client gave consent on {DateTime.Now:yyyy-MM-dd HH:mm} by user ID {userId}";
            }
            else
            {
                client.ConsentSMSNote = null;
            }

            // Actualizar
            var success = await _clientRepository.UpdateAsync(client);

            if (success)
            {
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Cliente actualizado exitosamente",
                    Data = true
                };
            }

            return new ApiResponse<bool>
            {
                Success = false,
                Message = "Error al actualizar el cliente",
                Data = false
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>
            {
                Success = false,
                Message = $"Error al actualizar cliente: {ex.Message}",
                Data = false
            };
        }
    }

    // ═══════════════════════════════════════
    //  DELETE CLIENT (SOFT DELETE)
    // ═══════════════════════════════════════
    public async Task<ApiResponse> DeleteAsync(int id)
    {
        try
        {
            if (id <= 0)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "ID de cliente inválido"
                };
            }

            var client = await _clientRepository.GetByIdAsync(id);
            if (client == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Cliente no encontrado"
                };
            }

            var success = await _clientRepository.DeleteAsync(id);

            if (success)
            {
                return new ApiResponse
                {
                    Success = true,
                    Message = "Cliente eliminado exitosamente"
                };
            }

            return new ApiResponse
            {
                Success = false,
                Message = "Error al eliminar el cliente"
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse
            {
                Success = false,
                Message = $"Error al eliminar cliente: {ex.Message}"
            };
        }
    }

    // ═══════════════════════════════════════
    //  CATÁLOGOS
    // ═══════════════════════════════════════
    public async Task<ApiResponse<List<LocationResponse>>> GetLocationsAsync()
    {
        try
        {
            var locations = await _clientRepository.GetLocationsAsync();

            return new ApiResponse<List<LocationResponse>>
            {
                Success = true,
                Message = "Ubicaciones obtenidas exitosamente",
                Data = locations
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<LocationResponse>>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<List<StateResponse>>> GetStatesAsync()
    {
        try
        {
            var states = await _clientRepository.GetStatesAsync();

            return new ApiResponse<List<StateResponse>>
            {
                Success = true,
                Message = "Estados obtenidos exitosamente",
                Data = states
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<StateResponse>>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<List<CityResponse>>> GetCitiesByStateAsync(int stateId)
    {
        try
        {
            if (stateId <= 0)
            {
                return new ApiResponse<List<CityResponse>>
                {
                    Success = false,
                    Message = "ID de estado inválido",
                    Data = null
                };
            }

            var cities = await _clientRepository.GetCitiesByStateAsync(stateId);

            return new ApiResponse<List<CityResponse>>
            {
                Success = true,
                Message = "Ciudades obtenidas exitosamente",
                Data = cities
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<CityResponse>>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<List<TypeClientResponse>>> GetTypeClientsAsync()
    {
        try
        {
            var types = await _clientRepository.GetTypeClientsAsync();

            return new ApiResponse<List<TypeClientResponse>>
            {
                Success = true,
                Message = "Tipos de cliente obtenidos exitosamente",
                Data = types
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<TypeClientResponse>>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    public async Task<ApiResponse<List<ServiceResponse>>> GetServicesByTypeClientAsync(int typeClientId)
    {
        try
        {
            if (typeClientId <= 0)
            {
                return new ApiResponse<List<ServiceResponse>>
                {
                    Success = false,
                    Message = "ID de tipo de cliente inválido",
                    Data = null
                };
            }

            var services = await _clientRepository.GetServicesByTypeClientAsync(typeClientId);

            return new ApiResponse<List<ServiceResponse>>
            {
                Success = true,
                Message = "Servicios obtenidos exitosamente",
                Data = services
            };
        }
        catch (Exception ex)
        {
            return new ApiResponse<List<ServiceResponse>>
            {
                Success = false,
                Message = $"Error: {ex.Message}",
                Data = null
            };
        }
    }

    // ═══════════════════════════════════════
    //  HELPER METHODS
    // ═══════════════════════════════════════
    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}