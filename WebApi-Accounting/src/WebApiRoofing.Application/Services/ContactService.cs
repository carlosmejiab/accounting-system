using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Contact;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Services
{
    public class ContactService : IContactService
    {
        private readonly IContactRepository _contactRepository;

        public ContactService(IContactRepository contactRepository)
        {
            _contactRepository = contactRepository;
        }

        public async Task<ApiResponse<IEnumerable<ContactResponse>>> GetAllAsync()
        {
            try
            {
                var contacts = await _contactRepository.GetAllAsync();
                var response = contacts.Select(MapToResponse);

                return ApiResponse<IEnumerable<ContactResponse>>.SuccessResponse(
                    response,
                    "Contacts retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<ContactResponse>>.ErrorResponse(
                    $"Error retrieving contacts: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<ContactResponse>> GetByIdAsync(int idContact)
        {
            try
            {
                var contact = await _contactRepository.GetByIdAsync(idContact);

                if (contact == null)
                {
                    return ApiResponse<ContactResponse>.ErrorResponse(
                        "Contact not found",
                        404
                    );
                }

                var response = MapToResponse(contact);
                return ApiResponse<ContactResponse>.SuccessResponse(
                    response,
                    "Contact retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<ContactResponse>.ErrorResponse(
                    $"Error retrieving contact: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<IEnumerable<ContactResponse>>> GetByClientAsync(int idClient)
        {
            try
            {
                var contacts = await _contactRepository.GetByClientAsync(idClient);
                var response = contacts.Select(MapToResponse);

                return ApiResponse<IEnumerable<ContactResponse>>.SuccessResponse(
                    response,
                    "Client contacts retrieved successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<ContactResponse>>.ErrorResponse(
                    $"Error retrieving client contacts: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<int>> CreateAsync(CreateContactRequest request, int userId)
        {
            try
            {
                // Validaciones
                if (string.IsNullOrWhiteSpace(request.FirstName))
                {
                    return ApiResponse<int>.ErrorResponse(
                        "First name is required",
                        400
                    );
                }

                if (request.IdClient <= 0)
                {
                    return ApiResponse<int>.ErrorResponse(
                        "Client ID is required",
                        400
                    );
                }

                var contact = new Contact
                {
                    IdCity = request.IdCity,
                    IdTitles = request.IdTitles,
                    IdEmployee = request.IdEmployee,
                    IdUser = userId,
                    IdClient = request.IdClient,
                    WordAreas = request.WordAreas,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Phone = request.Phone,
                    DateOfBirth = request.DateOfBirth,
                    Address = request.Address,
                    Description = request.Description,
                    PreferredChannel = request.PreferredChannel,
                    State = '1',
                    CreationDate = DateTime.Now,
                    ModificationDate = DateTime.Now
                };

                var idContact = await _contactRepository.CreateAsync(contact);

                return ApiResponse<int>.SuccessResponse(
                    idContact,
                    "Contact created successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse(
                    $"Error creating contact: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(int idContact, UpdateContactRequest request, int userId)
        {
            try
            {
                // Validaciones
                if (string.IsNullOrWhiteSpace(request.FirstName))
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "First name is required",
                        400
                    );
                }

                if (request.IdClient <= 0)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Client ID is required",
                        400
                    );
                }

                // Verificar que el contacto existe
                var existingContact = await _contactRepository.GetByIdAsync(idContact);
                if (existingContact == null)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Contact not found",
                        404
                    );
                }

                var contact = new Contact
                {
                    IdContact = idContact,
                    IdCity = request.IdCity,
                    IdTitles = request.IdTitles,
                    IdEmployee = request.IdEmployee,
                    IdUser = userId,
                    IdClient = request.IdClient,
                    WordAreas = request.WordAreas,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Phone = request.Phone,
                    DateOfBirth = request.DateOfBirth,
                    Address = request.Address,
                    Description = request.Description,
                    PreferredChannel = request.PreferredChannel,
                    State = '1',
                    CreationDate = existingContact.CreationDate,
                    ModificationDate = DateTime.Now
                };

                var result = await _contactRepository.UpdateAsync(contact);

                if (!result)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Failed to update contact"
                    );
                }

                return ApiResponse<bool>.SuccessResponse(
                    true,
                    "Contact updated successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Error updating contact: {ex.Message}"
                );
            }
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int idContact)
        {
            try
            {
                // Verificar que el contacto existe
                var existingContact = await _contactRepository.GetByIdAsync(idContact);
                if (existingContact == null)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Contact not found",
                        404
                    );
                }

                var result = await _contactRepository.DeleteAsync(idContact);

                if (!result)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Failed to delete contact"
                    );
                }

                return ApiResponse<bool>.SuccessResponse(
                    true,
                    "Contact deleted successfully"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Error deleting contact: {ex.Message}"
                );
            }
        }

        private static ContactResponse MapToResponse(Contact contact)
        {
            return new ContactResponse
            {
                IdContact = contact.IdContact,
                IdCity = contact.IdCity,
                IdTitles = contact.IdTitles,
                IdEmployee = contact.IdEmployee,
                IdUser = contact.IdUser,
                IdClient = contact.IdClient,
                WordAreas = contact.WordAreas,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                Email = contact.Email,
                Phone = contact.Phone,
                DateOfBirth = contact.DateOfBirth,
                Address = contact.Address,
                Description = contact.Description,
                PreferredChannel = contact.PreferredChannel,
                State = contact.State,
                CreationDate = contact.CreationDate,
                ModificationDate = contact.ModificationDate,
                CityName = contact.CityName,
                StateName = contact.StateName,
                TitleName = contact.TitleName,
                EmployeeName = contact.EmployeeName,
                ClientName = contact.ClientName,
                PreferredChannelName = contact.PreferredChannelName
            };
        }
    }

}
