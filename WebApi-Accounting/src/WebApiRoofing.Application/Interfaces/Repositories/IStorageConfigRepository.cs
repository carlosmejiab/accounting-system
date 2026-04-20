using WebApiRoofing.Application.DTOs.StorageConfig;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IStorageConfigRepository
    {
        Task<StorageConfigDto?> GetAsync();
        Task<bool> UpsertAsync(UpdateStorageConfigRequest request);
    }
}
