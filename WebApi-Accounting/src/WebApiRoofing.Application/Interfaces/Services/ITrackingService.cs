using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Tasks;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface ITrackingService
    {
        Task<ApiResponse<IEnumerable<TrackingDto>>>      GetByTaskAsync(int idTask);
        Task<ApiResponse<int>>                           CreateAsync(CreateTrackingRequest req);
        Task<ApiResponse<object>>                        PlayAsync(int idTracking);
        Task<ApiResponse<object>>                        PauseAsync(int idTracking, int secondsWorked);
        Task<ApiResponse<object>>                        StopAsync(int idTracking, int secondsWorked);
        Task<ApiResponse<IEnumerable<TrackingStatusDto>>>   GetStatusesAsync();
        Task<ApiResponse<IEnumerable<TrackingEmployeeDto>>> GetEmployeesAsync();
    }
}
