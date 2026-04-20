using WebApiRoofing.Application.DTOs.Events;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IEventRepository
    {
        Task<IEnumerable<EventResponse>> GetAllAsync(int idEmployee);
        Task<EventResponse?> GetByIdAsync(int idEvent);
        Task<int> CreateAsync(CreateEventRequest request, int idEmployeeCreate);
        Task<bool> UpdateAsync(int idEvent, UpdateEventRequest request, int idEmployeeCreate);
        Task<bool> DeleteAsync(int idEvent);
        Task<IEnumerable<EventParticipantDto>> GetParticipantsAsync(int idEvent);
        Task<IEnumerable<EventCatalogDto>> GetCatalogAsync(string tipo);
        Task<IEnumerable<EventCalendarDto>> GetCalendarAsync(int idEmployee);
    }
}
