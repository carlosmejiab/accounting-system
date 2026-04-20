using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Events;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _repo;

        public EventService(IEventRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<IEnumerable<EventResponse>>> GetAllAsync(int idEmployee)
        {
            try
            {
                var data = await _repo.GetAllAsync(idEmployee);
                return ApiResponse<IEnumerable<EventResponse>>.SuccessResponse(data, "Events retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EventResponse>>.ErrorResponse($"Error retrieving events: {ex.Message}");
            }
        }

        public async Task<ApiResponse<EventResponse>> GetByIdAsync(int idEvent)
        {
            try
            {
                var data = await _repo.GetByIdAsync(idEvent);
                if (data == null)
                    return ApiResponse<EventResponse>.ErrorResponse("Event not found", 404);
                return ApiResponse<EventResponse>.SuccessResponse(data, "Event retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<EventResponse>.ErrorResponse($"Error retrieving event: {ex.Message}");
            }
        }

        public async Task<ApiResponse<int>> CreateAsync(CreateEventRequest request, int idEmployeeCreate)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<int>.ErrorResponse("Name is required", 400);
                if (request.IdStatusEvent <= 0)
                    return ApiResponse<int>.ErrorResponse("Status is required", 400);
                if (request.IdActivityType <= 0)
                    return ApiResponse<int>.ErrorResponse("Activity Type is required", 400);
                if (request.IdLocation <= 0)
                    return ApiResponse<int>.ErrorResponse("Location is required", 400);
                if (request.IdPriority <= 0)
                    return ApiResponse<int>.ErrorResponse("Priority is required", 400);

                var newId = await _repo.CreateAsync(request, idEmployeeCreate);
                if (newId <= 0)
                    return ApiResponse<int>.ErrorResponse("Failed to create event");

                return ApiResponse<int>.SuccessResponse(newId, "Event created successfully", 201);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse($"Error creating event: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(int idEvent, UpdateEventRequest request, int idEmployeeCreate)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<bool>.ErrorResponse("Name is required", 400);
                if (request.IdStatusEvent <= 0)
                    return ApiResponse<bool>.ErrorResponse("Status is required", 400);
                if (request.IdActivityType <= 0)
                    return ApiResponse<bool>.ErrorResponse("Activity Type is required", 400);
                if (request.IdLocation <= 0)
                    return ApiResponse<bool>.ErrorResponse("Location is required", 400);
                if (request.IdPriority <= 0)
                    return ApiResponse<bool>.ErrorResponse("Priority is required", 400);

                await _repo.UpdateAsync(idEvent, request, idEmployeeCreate);
                return ApiResponse<bool>.SuccessResponse(true, "Event updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error updating event: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int idEvent)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(idEvent);
                if (existing == null)
                    return ApiResponse<bool>.ErrorResponse("Event not found", 404);

                await _repo.DeleteAsync(idEvent);
                return ApiResponse<bool>.SuccessResponse(true, "Event deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error deleting event: {ex.Message}");
            }
        }

        public async Task<ApiResponse<IEnumerable<EventParticipantDto>>> GetParticipantsAsync(int idEvent)
        {
            try
            {
                var data = await _repo.GetParticipantsAsync(idEvent);
                return ApiResponse<IEnumerable<EventParticipantDto>>.SuccessResponse(data, "Participants retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EventParticipantDto>>.ErrorResponse($"Error retrieving participants: {ex.Message}");
            }
        }

        public async Task<ApiResponse<IEnumerable<EventCatalogDto>>> GetCatalogAsync(string tipo)
        {
            try
            {
                var data = await _repo.GetCatalogAsync(tipo);
                return ApiResponse<IEnumerable<EventCatalogDto>>.SuccessResponse(data, "Catalog retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EventCatalogDto>>.ErrorResponse($"Error retrieving catalog: {ex.Message}");
            }
        }

        public async Task<ApiResponse<IEnumerable<EventCalendarDto>>> GetCalendarAsync(int idEmployee)
        {
            try
            {
                var data = await _repo.GetCalendarAsync(idEmployee);
                return ApiResponse<IEnumerable<EventCalendarDto>>.SuccessResponse(data, "Calendar events retrieved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<EventCalendarDto>>.ErrorResponse($"Error retrieving calendar events: {ex.Message}");
            }
        }
    }
}
