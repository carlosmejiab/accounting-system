using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApiRoofing.Application.DTOs.StorageConfig;
using WebApiRoofing.Application.Interfaces.Repositories;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class StorageConfigRepository : IStorageConfigRepository
    {
        private readonly string _cs;

        public StorageConfigRepository(IConfiguration cfg)
            => _cs = cfg.GetConnectionString("DefaultConnection")!;

        public async Task<StorageConfigDto?> GetAsync()
        {
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                "SELECT TOP 1 Id, BasePath, TaskTemplate, ClientTemplate, ModificationDate FROM dbo.StorageConfig", con);
            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return null;
            return new StorageConfigDto
            {
                Id               = r.GetInt32(0),
                BasePath         = r.GetString(1),
                TaskTemplate     = r.GetString(2),
                ClientTemplate   = r.GetString(3),
                ModificationDate = r.GetDateTime(4)
            };
        }

        public async Task<bool> UpsertAsync(UpdateStorageConfigRequest req)
        {
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();

            using var chk = new SqlCommand("SELECT COUNT(1) FROM dbo.StorageConfig", con);
            var exists = (int)(await chk.ExecuteScalarAsync() ?? 0) > 0;

            var sql = exists
                ? "UPDATE dbo.StorageConfig SET BasePath=@B, TaskTemplate=@T, ClientTemplate=@C, ModificationDate=GETDATE()"
                : "INSERT INTO dbo.StorageConfig (BasePath,TaskTemplate,ClientTemplate,CreationDate,ModificationDate) VALUES(@B,@T,@C,GETDATE(),GETDATE())";

            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@B", req.BasePath);
            cmd.Parameters.AddWithValue("@T", req.TaskTemplate);
            cmd.Parameters.AddWithValue("@C", req.ClientTemplate);
            await cmd.ExecuteNonQueryAsync();
            return true;
        }
    }
}
