using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.StorageConfig;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services
{
    public class StorageConfigService : IStorageConfigService
    {
        private readonly IStorageConfigRepository _repo;

        public StorageConfigService(IStorageConfigRepository repo) => _repo = repo;

        public async Task<ApiResponse<StorageConfigDto>> GetAsync()
        {
            try
            {
                var d = await _repo.GetAsync();
                if (d == null) return ApiResponse<StorageConfigDto>.ErrorResponse("No config found", 404);
                return ApiResponse<StorageConfigDto>.SuccessResponse(d, "OK");
            }
            catch (Exception ex) { return ApiResponse<StorageConfigDto>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<bool>> UpdateAsync(UpdateStorageConfigRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.BasePath))
                    return ApiResponse<bool>.ErrorResponse("BasePath is required", 400);
                await _repo.UpsertAsync(req);
                return ApiResponse<bool>.SuccessResponse(true, "Storage config saved");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        public async Task<string> ResolveTaskPathAsync(int idTask, string taskName, string clientName, int year)
        {
            var cfg = await _repo.GetAsync();
            var basePath = cfg?.BasePath ?? @"C:\DocumentosServer";
            var template = cfg?.TaskTemplate ?? @"{Year}\{ClientName}\Task-{IdTask}";

            var relative = template
                .Replace("{Year}",       year.ToString())
                .Replace("{ClientName}", Sanitize(clientName))
                .Replace("{IdTask}",     idTask.ToString())
                .Replace("{TaskName}",   Sanitize(taskName));

            return Path.Combine(basePath, relative);
        }

        public async Task<string> ResolveClientPathAsync(string clientName)
        {
            var cfg = await _repo.GetAsync();
            var basePath = cfg?.BasePath ?? @"C:\DocumentosServer";
            var template = cfg?.ClientTemplate ?? @"{ClientName}\GENERAL";

            var relative = template.Replace("{ClientName}", Sanitize(clientName));
            return Path.Combine(basePath, relative);
        }

        private static string Sanitize(string name)
        {
            var invalid = Path.GetInvalidFileNameChars();
            return string.Concat((name ?? "UNKNOWN").Where(c => !invalid.Contains(c))).Trim();
        }
    }
}
