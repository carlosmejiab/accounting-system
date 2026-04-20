using WebApiRoofing.Application.DTOs.ClientAccount;
using WebApiRoofing.Application.DTOs.Common;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IClientAccountService
    {
        Task<ApiResponse<IEnumerable<ClientAccountResponse>>> GetAllAsync();
        Task<ApiResponse<ClientAccountResponse>> GetByIdAsync(int idClientAccount);
        Task<ApiResponse<IEnumerable<ClientAccountResponse>>> GetByClientAsync(int idClient);
        Task<ApiResponse<int>> CreateAsync(CreateClientAccountRequest request, int userId);
        Task<ApiResponse<bool>> UpdateAsync(int idClientAccount, UpdateClientAccountRequest request, int userId);
        Task<ApiResponse<bool>> DeleteAsync(int idClientAccount);
        Task<ApiResponse<IEnumerable<BankCatalogDto>>> GetBanksAsync();
    }
}

