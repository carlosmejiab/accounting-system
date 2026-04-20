using WebApiRoofing.Application.DTOs.Contact;
using WebApiRoofing.Application.DTOs.Common;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IContactService
    {
        Task<ApiResponse<IEnumerable<ContactResponse>>> GetAllAsync();
        Task<ApiResponse<ContactResponse>> GetByIdAsync(int idContact);
        Task<ApiResponse<IEnumerable<ContactResponse>>> GetByClientAsync(int idClient);
        Task<ApiResponse<int>> CreateAsync(CreateContactRequest request, int userId);
        Task<ApiResponse<bool>> UpdateAsync(int idContact, UpdateContactRequest request, int userId);
        Task<ApiResponse<bool>> DeleteAsync(int idContact);
    }
}