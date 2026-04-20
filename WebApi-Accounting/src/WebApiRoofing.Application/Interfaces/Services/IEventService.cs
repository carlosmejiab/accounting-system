using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Events;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IEventService
    {
        Task<ApiResponse<IEnumerable<EventResponse>>> GetAllAsync(int idEmployee);
        Task<ApiResponse<EventResponse>> GetByIdAsync(int idEvent);
        Task<ApiResponse<int>> CreateAsync(CreateEventRequest request, int idEmployeeCreate);
        Task<ApiResponse<bool>> UpdateAsync(int idEvent, UpdateEventRequest request, int idEmployeeCreate);
        Task<ApiResponse<bool>> DeleteAsync(int idEvent);
        Task<ApiResponse<IEnumerable<EventParticipantDto>>> GetParticipantsAsync(int idEvent);
        Task<ApiResponse<IEnumerable<EventCatalogDto>>> GetCatalogAsync(string tipo);
        Task<ApiResponse<IEnumerable<EventCalendarDto>>> GetCalendarAsync(int idEmployee);
    }
}
