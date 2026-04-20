using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IContactRepository
    {
        Task<IEnumerable<Contact>> GetAllAsync();
        Task<Contact?> GetByIdAsync(int idContact);
        Task<IEnumerable<Contact>> GetByClientAsync(int idClient);
        Task<int> CreateAsync(Contact contact);
        Task<bool> UpdateAsync(Contact contact);
        Task<bool> DeleteAsync(int idContact);
    }
}
