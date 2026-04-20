using WebApiRoofing.Application.DTOs.Tasks;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface ITrackingRepository
    {
        Task<IEnumerable<TrackingDto>>      GetByTaskAsync(int idTask);
        Task<int>                           CreateAsync(CreateTrackingRequest req);
        Task                                PlayAsync(int idTracking);
        Task                                PauseAsync(int idTracking, int secondsWorked);
        Task                                StopAsync(int idTracking, int secondsWorked);
        Task<IEnumerable<TrackingStatusDto>>   GetStatusesAsync();
        Task<IEnumerable<TrackingEmployeeDto>> GetEmployeesAsync();
    }
}
