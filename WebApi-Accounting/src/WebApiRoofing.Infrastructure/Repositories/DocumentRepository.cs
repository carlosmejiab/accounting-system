using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using WebApiRoofing.Application.DTOs.Documents;
using WebApiRoofing.Application.Interfaces.Repositories;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class DocumentRepository : IDocumentRepository
    {
        private readonly string _cs;

        public DocumentRepository(IConfiguration cfg)
            => _cs = cfg.GetConnectionString("DefaultConnection")!;

        // ─────────────────────────────────────────────────────────────────────
        //  Shared SQL base
        // ─────────────────────────────────────────────────────────────────────
        private const string BASE_SELECT = @"
            SELECT a.IdDocument, a.NameDocument, a.Descripction, a.State,
                   a.CreationDate, a.ModificationDate,
                   a.IdClient, c.Name AS ClientName,
                   a.IdTask, e.Name AS TaskName,
                   e.IdClient AS IdClientTask, ec.Name AS ClientTaskName,
                   a.IdEmployee, d.FirstName + ' ' + d.LastName AS AssignedTo,
                   a.IdFolder, f.Name AS FolderName,
                   a.IdFile, b.NameFile,
                   a.IdStatusDocument, g.Description AS StatusDocument,
                   h.Username
            FROM   dbo.Document a
            INNER  JOIN dbo.[File]      b  ON b.IdFile      = a.IdFile
            LEFT   JOIN dbo.Client      c  ON c.IdClient    = a.IdClient
            INNER  JOIN dbo.Employees   d  ON d.IdEmployee  = a.IdEmployee
            LEFT   JOIN dbo.Task        e  ON e.IdTask      = a.IdTask
            LEFT   JOIN dbo.Client      ec ON ec.IdClient   = e.IdClient
            LEFT   JOIN dbo.Folder      f  ON f.IdFolder    = a.IdFolder
            INNER  JOIN dbo.TablaMaestra g  ON g.IdTabla    = a.IdStatusDocument
            INNER  JOIN dbo.Users       h  ON h.Id          = a.IdUser";

        // ─────────────────────────────────────────────────────────────────────
        //  GET ALL
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<DocumentResponse>> GetAllAsync()
        {
            var sql = BASE_SELECT + " WHERE a.State='1' ORDER BY a.NameDocument";
            return await QueryDocumentsAsync(sql);
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET BY ID
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DocumentResponse?> GetByIdAsync(int id)
        {
            var sql = BASE_SELECT + " WHERE a.IdDocument=@Id";
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = await cmd.ExecuteReaderAsync();
            return await r.ReadAsync() ? MapDocument(r) : null;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET BY TASK
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<DocumentResponse>> GetByTaskAsync(int idTask)
        {
            var sql = BASE_SELECT + " WHERE a.IdTask=@IdTask AND a.State='1' ORDER BY a.NameDocument";
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdTask", idTask);
            using var r = await cmd.ExecuteReaderAsync();
            var list = new List<DocumentResponse>();
            while (await r.ReadAsync()) list.Add(MapDocument(r));
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET BY CLIENT (no task — general client documents)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<DocumentResponse>> GetByClientAsync(int idClient)
        {
            var sql = BASE_SELECT + " WHERE a.IdClient=@IdClient AND a.IdTask IS NULL AND a.State='1' ORDER BY a.NameDocument";
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdClient", idClient);
            using var r = await cmd.ExecuteReaderAsync();
            var list = new List<DocumentResponse>();
            while (await r.ReadAsync()) list.Add(MapDocument(r));
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  TASK SUMMARIES
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<TaskDocumentSummaryDto>> GetTaskSummariesAsync()
        {
            const string sql = @"
                SELECT t.IdTask, t.Name AS TaskName,
                       c.IdClient, c.Name AS ClientName,
                       COUNT(CASE WHEN d.IdDocument IS NOT NULL THEN 1 END) AS DocCount,
                       MAX(f.IdFolder) AS IdFolder,
                       CASE WHEN MAX(f.IdFolder) IS NOT NULL THEN 1 ELSE 0 END AS HasFolder
                FROM   dbo.Task t
                LEFT   JOIN dbo.Client   c ON c.IdClient = t.IdClient
                LEFT   JOIN dbo.Document d ON d.IdTask   = t.IdTask AND d.State = '1'
                LEFT   JOIN dbo.Folder   f ON f.Name     = CONCAT('Task-', t.IdTask, ' ', t.Name)
                WHERE  t.State = '1'
                GROUP  BY t.IdTask, t.Name, c.IdClient, c.Name
                ORDER  BY t.Name ASC";

            var list = new List<TaskDocumentSummaryDto>();
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TaskDocumentSummaryDto
                {
                    IdTask     = r.GetInt32(r.GetOrdinal("IdTask")),
                    TaskName   = r.GetString(r.GetOrdinal("TaskName")),
                    IdClient   = r.IsDBNull(r.GetOrdinal("IdClient"))   ? null : r.GetInt32(r.GetOrdinal("IdClient")),
                    ClientName = r.IsDBNull(r.GetOrdinal("ClientName")) ? null : r.GetString(r.GetOrdinal("ClientName")),
                    DocCount   = r.GetInt32(r.GetOrdinal("DocCount")),
                    IdFolder   = r.IsDBNull(r.GetOrdinal("IdFolder"))   ? null : r.GetInt32(r.GetOrdinal("IdFolder")),
                    HasFolder  = r.GetInt32(r.GetOrdinal("HasFolder")) == 1,
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CLIENT SUMMARIES
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<ClientDocumentSummaryDto>> GetClientSummariesAsync()
        {
            const string sql = @"
                SELECT c.IdClient, c.Name AS ClientName,
                       COUNT(d.IdDocument) AS DocCount,
                       MAX(f.IdFolder) AS IdFolder,
                       CASE WHEN MAX(f.IdFolder) IS NOT NULL THEN 1 ELSE 0 END AS HasFolder
                FROM   dbo.Client c
                LEFT   JOIN dbo.Document d ON d.IdClient = c.IdClient AND d.IdTask IS NULL AND d.State = '1'
                LEFT   JOIN dbo.Folder   f ON f.IdClient = c.IdClient
                WHERE  c.State = 'Active'
                GROUP  BY c.IdClient, c.Name
                ORDER  BY c.Name ASC";

            var list = new List<ClientDocumentSummaryDto>();
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ClientDocumentSummaryDto
                {
                    IdClient   = r.GetInt32(r.GetOrdinal("IdClient")),
                    ClientName = r.GetString(r.GetOrdinal("ClientName")),
                    DocCount   = r.GetInt32(r.GetOrdinal("DocCount")),
                    IdFolder   = r.IsDBNull(r.GetOrdinal("IdFolder")) ? null : r.GetInt32(r.GetOrdinal("IdFolder")),
                    HasFolder  = r.GetInt32(r.GetOrdinal("HasFolder")) == 1,
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CREATE DOCUMENT
        // ─────────────────────────────────────────────────────────────────────
        public async Task<int> CreateAsync(CreateDocumentRequest request, string fileName, string routeFile, int idUser)
        {
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();

            const string insertFile = @"
                INSERT INTO dbo.[File] (NameFile, RouteFile, StatusFile, CreationDate, ModificationDate)
                VALUES (@NameFile, @RouteFile, '1', GETDATE(), GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idFile;
            using (var cmd = new SqlCommand(insertFile, con))
            {
                cmd.Parameters.AddWithValue("@NameFile",  fileName);
                cmd.Parameters.AddWithValue("@RouteFile", routeFile);
                var res = await cmd.ExecuteScalarAsync();
                idFile = res != null ? Convert.ToInt32(res) : 0;
            }
            if (idFile <= 0) return 0;

            const string insertDoc = @"
                INSERT INTO dbo.Document
                    (IdFile, IdClient, IdTask, IdEmployee, IdFolder, IdStatusDocument, IdUser,
                     NameDocument, Descripction, State, CreationDate, ModificationDate)
                VALUES
                    (@IdFile, @IdClient, @IdTask, @IdEmployee, @IdFolder, @IdStatusDocument, @IdUser,
                     @NameDocument, @Descripcion, '1', GETDATE(), GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using (var cmd = new SqlCommand(insertDoc, con))
            {
                cmd.Parameters.AddWithValue("@IdFile",           idFile);
                cmd.Parameters.AddWithValue("@IdClient",         (object?)request.IdClient         ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdTask",           (object?)request.IdTask              ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdEmployee",       request.IdEmployee);
                cmd.Parameters.AddWithValue("@IdFolder",         (object?)(request.IdFolder > 0 ? request.IdFolder : null) ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdStatusDocument", request.IdStatusDocument);
                cmd.Parameters.AddWithValue("@IdUser",           idUser);
                cmd.Parameters.AddWithValue("@NameDocument",     request.NameDocument);
                cmd.Parameters.AddWithValue("@Descripcion",      (object?)request.Description ?? DBNull.Value);
                var res = await cmd.ExecuteScalarAsync();
                return res != null ? Convert.ToInt32(res) : 0;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        //  UPDATE
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateAsync(int idDocument, UpdateDocumentRequest request)
        {
            const string sql = @"
                UPDATE dbo.Document SET
                    IdClient=@IdClient, IdTask=@IdTask, IdEmployee=@IdEmployee,
                    IdFolder=@IdFolder, IdStatusDocument=@IdStatusDocument,
                    NameDocument=@NameDocument, Descripction=@Descripcion,
                    State=@State, ModificationDate=GETDATE()
                WHERE IdDocument=@IdDocument";

            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdDocument",       idDocument);
            cmd.Parameters.AddWithValue("@IdClient",         (object?)request.IdClient  ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdTask",           (object?)request.IdTask    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdEmployee",       request.IdEmployee);
            cmd.Parameters.AddWithValue("@IdFolder",         (object?)(request.IdFolder > 0 ? request.IdFolder : null) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdStatusDocument", request.IdStatusDocument);
            cmd.Parameters.AddWithValue("@NameDocument",     request.NameDocument);
            cmd.Parameters.AddWithValue("@Descripcion",      (object?)request.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@State",            request.IsActive ? "1" : "0");
            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  DELETE (soft)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> DeleteAsync(int idDocument)
        {
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                "UPDATE dbo.Document SET State='0', ModificationDate=GETDATE() WHERE IdDocument=@Id", con);
            cmd.Parameters.AddWithValue("@Id", idDocument);
            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  FOLDERS
        // ─────────────────────────────────────────────────────────────────────
        private const string FOLDER_SELECT = @"
            SELECT a.IdFolder, a.Name, a.FolderParent, a.Ruta,
                   a.IdClient, b.Name AS ClientName
            FROM   dbo.Folder a
            LEFT   JOIN dbo.Client b ON b.IdClient = a.IdClient";

        public async Task<IEnumerable<FolderResponse>> GetFoldersAsync()
        {
            var sql = FOLDER_SELECT + " ORDER BY a.Name";
            return await QueryFoldersAsync(sql);
        }

        public async Task<FolderResponse?> GetFolderByIdAsync(int idFolder)
        {
            var sql = FOLDER_SELECT + " WHERE a.IdFolder=@Id";
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@Id", idFolder);
            using var r = await cmd.ExecuteReaderAsync();
            return await r.ReadAsync() ? MapFolder(r) : null;
        }

        public Task<FolderResponse?> GetFolderByTaskAsync(int idTask)
            => Task.FromResult<FolderResponse?>(null); // IdTask column not in dbo.Folder yet

        public async Task<IEnumerable<FolderResponse>> GetFoldersByClientAsync(int idClient)
        {
            var sql = FOLDER_SELECT + " WHERE a.IdClient=@IdClient ORDER BY a.Name";
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdClient", idClient);
            using var r = await cmd.ExecuteReaderAsync();
            var list = new List<FolderResponse>();
            while (await r.ReadAsync()) list.Add(MapFolder(r));
            return list;
        }

        public async Task<int> CreateFolderAsync(CreateFolderRequest request)
        {
            const string sql = @"
                INSERT INTO dbo.Folder (IdClient, FolderParent, Name, Ruta, CreationDate, ModificationDate)
                VALUES (@IdClient, @FolderParent, @Name, @Ruta, GETDATE(), GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdClient",    (object?)request.IdClient   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@FolderParent",(object?)request.ParentRuta ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Name",        request.Name);
            cmd.Parameters.AddWithValue("@Ruta",        (object?)request.ParentRuta ?? (object)request.Name);
            var res = await cmd.ExecuteScalarAsync();
            return res != null ? Convert.ToInt32(res) : 0;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CATALOG
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<DocumentCatalogDto>> GetCatalogAsync(string tipo)
        {
            var list = new List<DocumentCatalogDto>();
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Tablas_Todo", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@TIPO", tipo);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new DocumentCatalogDto
                {
                    IdTabla     = r.GetInt32(r.GetOrdinal("IdTabla")),
                    Description = r.IsDBNull(r.GetOrdinal("Description")) ? "" : r.GetString(r.GetOrdinal("Description"))
                });
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  FILE INFO
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(string FileName, string RouteFile)?> GetFileInfoAsync(int idDocument)
        {
            const string sql = @"
                SELECT b.NameFile, b.RouteFile
                FROM   dbo.Document a
                INNER  JOIN dbo.[File] b ON b.IdFile = a.IdFile
                WHERE  a.IdDocument=@Id";

            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@Id", idDocument);
            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return null;
            return (r.GetString(0), r.GetString(1));
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CLIENT NAME HELPER
        // ─────────────────────────────────────────────────────────────────────
        public async Task<string?> GetClientNameAsync(int idClient)
        {
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand("SELECT Name FROM dbo.Client WHERE IdClient=@Id", con);
            cmd.Parameters.AddWithValue("@Id", idClient);
            var res = await cmd.ExecuteScalarAsync();
            return res as string;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  MAPPERS
        // ─────────────────────────────────────────────────────────────────────
        private static DocumentResponse MapDocument(SqlDataReader r)
        {
            var fn = r.IsDBNull(r.GetOrdinal("NameFile")) ? null : r.GetString(r.GetOrdinal("NameFile"));
            return new DocumentResponse
            {
                IdDocument       = r.GetInt32(r.GetOrdinal("IdDocument")),
                NameDocument     = r.GetString(r.GetOrdinal("NameDocument")),
                Description      = r.IsDBNull(r.GetOrdinal("Descripction"))    ? null : r.GetString(r.GetOrdinal("Descripction")),
                State            = r.IsDBNull(r.GetOrdinal("State"))            ? null : Convert.ToString(r.GetValue(r.GetOrdinal("State"))),
                CreationDate     = r.GetDateTime(r.GetOrdinal("CreationDate")),
                ModificationDate = r.GetDateTime(r.GetOrdinal("ModificationDate")),
                IdClient         = r.IsDBNull(r.GetOrdinal("IdClient"))         ? null : r.GetInt32(r.GetOrdinal("IdClient")),
                ClientName       = r.IsDBNull(r.GetOrdinal("ClientName"))       ? null : r.GetString(r.GetOrdinal("ClientName")),
                IdTask           = r.IsDBNull(r.GetOrdinal("IdTask"))           ? null : r.GetInt32(r.GetOrdinal("IdTask")),
                TaskName         = r.IsDBNull(r.GetOrdinal("TaskName"))         ? null : r.GetString(r.GetOrdinal("TaskName")),
                IdClientTask     = r.IsDBNull(r.GetOrdinal("IdClientTask"))     ? null : r.GetInt32(r.GetOrdinal("IdClientTask")),
                ClientTaskName   = r.IsDBNull(r.GetOrdinal("ClientTaskName"))   ? null : r.GetString(r.GetOrdinal("ClientTaskName")),
                IdEmployee       = r.IsDBNull(r.GetOrdinal("IdEmployee"))       ? null : r.GetInt32(r.GetOrdinal("IdEmployee")),
                AssignedTo       = r.IsDBNull(r.GetOrdinal("AssignedTo"))       ? null : r.GetString(r.GetOrdinal("AssignedTo")),
                IdFolder         = r.IsDBNull(r.GetOrdinal("IdFolder"))         ? null : r.GetInt32(r.GetOrdinal("IdFolder")),
                FolderName       = r.IsDBNull(r.GetOrdinal("FolderName"))       ? null : r.GetString(r.GetOrdinal("FolderName")),
                IdFile           = r.IsDBNull(r.GetOrdinal("IdFile"))           ? null : r.GetInt32(r.GetOrdinal("IdFile")),
                FileName         = fn,
                Extension        = fn != null ? Path.GetExtension(fn).TrimStart('.').ToLower() : null,
                IdStatusDocument = r.IsDBNull(r.GetOrdinal("IdStatusDocument")) ? null : r.GetInt32(r.GetOrdinal("IdStatusDocument")),
                StatusDocument   = r.IsDBNull(r.GetOrdinal("StatusDocument"))   ? null : r.GetString(r.GetOrdinal("StatusDocument")),
                Username         = r.IsDBNull(r.GetOrdinal("Username"))         ? null : r.GetString(r.GetOrdinal("Username")),
            };
        }

        private static FolderResponse MapFolder(SqlDataReader r) => new FolderResponse
        {
            IdFolder     = r.GetInt32(r.GetOrdinal("IdFolder")),
            Name         = r.IsDBNull(r.GetOrdinal("Name"))         ? "" : r.GetString(r.GetOrdinal("Name")),
            FolderParent = r.IsDBNull(r.GetOrdinal("FolderParent")) ? null : r.GetString(r.GetOrdinal("FolderParent")),
            Ruta         = r.IsDBNull(r.GetOrdinal("Ruta"))         ? null : r.GetString(r.GetOrdinal("Ruta")),
            IdClient     = r.IsDBNull(r.GetOrdinal("IdClient"))     ? null : r.GetInt32(r.GetOrdinal("IdClient")),
            ClientName   = r.IsDBNull(r.GetOrdinal("ClientName"))   ? null : r.GetString(r.GetOrdinal("ClientName")),
            IdTask       = null,
            TaskName     = null,
        };

        // ─────────────────────────────────────────────────────────────────────
        //  HELPERS
        // ─────────────────────────────────────────────────────────────────────
        private async Task<List<DocumentResponse>> QueryDocumentsAsync(string sql)
        {
            var list = new List<DocumentResponse>();
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapDocument(r));
            return list;
        }

        private async Task<List<FolderResponse>> QueryFoldersAsync(string sql)
        {
            var list = new List<FolderResponse>();
            using var con = new SqlConnection(_cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapFolder(r));
            return list;
        }
    }
}
