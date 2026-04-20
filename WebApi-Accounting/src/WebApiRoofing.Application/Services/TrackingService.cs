using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services
{
    public class TrackingService : ITrackingService
    {
        private readonly ITrackingRepository _repo;

        public TrackingService(ITrackingRepository repo)
        {
            _repo = repo;
        }

        public async System.Threading.Tasks.Task<ApiResponse<IEnumerable<TrackingDto>>> GetByTaskAsync(int idTask)
        {
            try
            {
                var data = await _repo.GetByTaskAsync(idTask);
                return ApiResponse<IEnumerable<TrackingDto>>.SuccessResponse(data, "OK");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<TrackingDto>>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<int>> CreateAsync(CreateTrackingRequest req)
        {
            try
            {
                var id = await _repo.CreateAsync(req);
                return ApiResponse<int>.SuccessResponse(id, "Tracking created", 201);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<object>> PlayAsync(int idTracking)
        {
            try
            {
                await _repo.PlayAsync(idTracking);
                return ApiResponse<object>.SuccessResponse(null!, "Playing");
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<object>> PauseAsync(int idTracking, int secondsWorked)
        {
            try
            {
                await _repo.PauseAsync(idTracking, secondsWorked);
                return ApiResponse<object>.SuccessResponse(null!, "Paused");
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<object>> StopAsync(int idTracking, int secondsWorked)
        {
            try
            {
                await _repo.StopAsync(idTracking, secondsWorked);
                return ApiResponse<object>.SuccessResponse(null!, "Stopped");
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<IEnumerable<TrackingStatusDto>>> GetStatusesAsync()
        {
            try
            {
                var data = await _repo.GetStatusesAsync();
                return ApiResponse<IEnumerable<TrackingStatusDto>>.SuccessResponse(data, "OK");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<TrackingStatusDto>>.ErrorResponse(ex.Message);
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<IEnumerable<TrackingEmployeeDto>>> GetEmployeesAsync()
        {
            try
            {
                var data = await _repo.GetEmployeesAsync();
                return ApiResponse<IEnumerable<TrackingEmployeeDto>>.SuccessResponse(data, "OK");
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<TrackingEmployeeDto>>.ErrorResponse(ex.Message);
            }
        }
    }
}
