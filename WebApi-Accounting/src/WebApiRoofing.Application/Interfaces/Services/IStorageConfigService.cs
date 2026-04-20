using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.StorageConfig;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IStorageConfigService
    {
        Task<ApiResponse<StorageConfigDto>> GetAsync();
        Task<ApiResponse<bool>>             UpdateAsync(UpdateStorageConfigRequest request);
        Task<string> ResolveTaskPathAsync(int idTask, string taskName, string clientName, int year);
        Task<string> ResolveClientPathAsync(string clientName);
    }
}
