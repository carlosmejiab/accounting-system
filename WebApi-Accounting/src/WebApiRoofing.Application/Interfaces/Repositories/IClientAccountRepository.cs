using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebApiRoofing.Application.DTOs.ClientAccount;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IClientAccountRepository
    {
        Task<IEnumerable<ClientAccount>> GetAllAsync();
        Task<ClientAccount?> GetByIdAsync(int idClientAccount);
        Task<IEnumerable<ClientAccount>> GetByClientAsync(int idClient);
        Task<int> CreateAsync(ClientAccount clientAccount);
        Task<bool> UpdateAsync(ClientAccount clientAccount);
        Task<bool> DeleteAsync(int idClientAccount);
        Task<IEnumerable<DTOs.ClientAccount.BankCatalogDto>> GetBanksAsync();
    }
}
