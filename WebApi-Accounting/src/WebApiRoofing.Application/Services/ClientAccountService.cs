using WebApiRoofing.Application.DTOs.ClientAccount;
using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Services
{
    public class ClientAccountService : IClientAccountService
    {
        private readonly IClientAccountRepository _clientAccountRepository;

        public ClientAccountService(IClientAccountRepository clientAccountRepository)
        {
            _clientAccountRepository = clientAccountRepository;
        }

        public async Task<ApiResponse<IEnumerable<ClientAccountResponse>>> GetAllAsync()
        {
            try
            {
                var accounts = await _clientAccountRepository.GetAllAsync();
                var response = accounts.Select(MapToResponse);

                return ApiResponse<IEnumerable<ClientAccountResponse>>.SuccessResponse(
                    response,
                    "Client accounts retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<ClientAccountResponse>>.ErrorResponse(
                    $"Error retrieving client accounts: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<ClientAccountResponse>> GetByIdAsync(int idClientAccount)
        {
            try
            {
                var account = await _clientAccountRepository.GetByIdAsync(idClientAccount);

                if (account == null)
                {
                    return ApiResponse<ClientAccountResponse>.ErrorResponse(
                        "Client account not found",
                        404
                    );
                }

                var response = MapToResponse(account);
                return ApiResponse<ClientAccountResponse>.SuccessResponse(
                    response,
                    "Client account retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<ClientAccountResponse>.ErrorResponse(
                    $"Error retrieving client account: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<IEnumerable<ClientAccountResponse>>> GetByClientAsync(int idClient)
        {
            try
            {
                var accounts = await _clientAccountRepository.GetByClientAsync(idClient);
                var response = accounts.Select(MapToResponse);

                return ApiResponse<IEnumerable<ClientAccountResponse>>.SuccessResponse(
                    response,
                    "Client accounts retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<ClientAccountResponse>>.ErrorResponse(
                    $"Error retrieving client accounts: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<int>> CreateAsync(CreateClientAccountRequest request, int userId)
        {
            try
            {
                // Validaciones
                if (request.IdClient <= 0)
                {
                    return ApiResponse<int>.ErrorResponse(
                        "Client ID is required",
                        400
                    );
                }

                if (request.IdBank <= 0)
                {
                    return ApiResponse<int>.ErrorResponse(
                        "Bank ID is required",
                        400
                    );
                }

                if (string.IsNullOrWhiteSpace(request.AccountNumber))
                {
                    return ApiResponse<int>.ErrorResponse(
                        "Account number is required",
                        400
                    );
                }

                var clientAccount = new ClientAccount
                {
                    IdClient = request.IdClient,
                    IdBank = request.IdBank,
                    AccountNumber = request.AccountNumber,
                    State = request.IsActive ? '1' : '0',
                    IdUser = userId,
                    CreationDate = DateTime.Now,
                    ModificationDate = DateTime.Now
                };

                var idClientAccount = await _clientAccountRepository.CreateAsync(clientAccount);

                return ApiResponse<int>.SuccessResponse(
                    idClientAccount,
                    "Client account created successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse(
                    $"Error creating client account: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(int idClientAccount, UpdateClientAccountRequest request, int userId)
        {
            try
            {
                // Validaciones
                if (request.IdClient <= 0)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Client ID is required",
                        400
                    );
                }

                if (request.IdBank <= 0)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Bank ID is required",
                        400
                    );
                }

                if (string.IsNullOrWhiteSpace(request.AccountNumber))
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Account number is required",
                        400
                    );
                }

                // Verificar que la cuenta existe
                var existingAccount = await _clientAccountRepository.GetByIdAsync(idClientAccount);
                if (existingAccount == null)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Client account not found",
                        404
                    );
                }

                var clientAccount = new ClientAccount
                {
                    IdClientAccount = idClientAccount,
                    IdClient = request.IdClient,
                    IdBank = request.IdBank,
                    AccountNumber = request.AccountNumber,
                    State = request.IsActive ? '1' : '0',
                    IdUser = userId,
                    CreationDate = existingAccount.CreationDate,
                    ModificationDate = DateTime.Now
                };

                var result = await _clientAccountRepository.UpdateAsync(clientAccount);

                if (!result)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Failed to update client account"
                    );
                }

                return ApiResponse<bool>.SuccessResponse(
                    true,
                    "Client account updated successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Error updating client account: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int idClientAccount)
        {
            try
            {
                // Verificar que la cuenta existe
                var existingAccount = await _clientAccountRepository.GetByIdAsync(idClientAccount);
                if (existingAccount == null)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Client account not found",
                        404
                    );
                }

                var result = await _clientAccountRepository.DeleteAsync(idClientAccount);

                if (!result)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Failed to delete client account"
                    );
                }

                return ApiResponse<bool>.SuccessResponse(
                    true,
                    "Client account deleted successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Error deleting client account: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<IEnumerable<BankCatalogDto>>> GetBanksAsync()
        {
            try
            {
                var banks = await _clientAccountRepository.GetBanksAsync();
                return ApiResponse<IEnumerable<BankCatalogDto>>.SuccessResponse(banks, "OK");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<BankCatalogDto>>.ErrorResponse($"Error retrieving banks: {ex.Message}");
            }
        }

        private static ClientAccountResponse MapToResponse(ClientAccount account)
        {
            return new ClientAccountResponse
            {
                IdClientAccount = account.IdClientAccount,
                IdClient = account.IdClient,
                IdBank = account.IdBank,
                AccountNumber = account.AccountNumber,
                State = account.State,
                IdUser = account.IdUser,
                CreationDate = account.CreationDate,
                ModificationDate = account.ModificationDate,
                ClientName = account.ClientName,
                BankName = account.BankName
            };
        }
    }
}
