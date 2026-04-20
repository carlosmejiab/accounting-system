using Microsoft.AspNetCore.Http;
using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Documents;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Application.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly IDocumentRepository    _repo;
        private readonly IStorageConfigService  _storage;

        private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase)
            { ".pdf",".doc",".docx",".xls",".xlsx",".ppt",".pptx",
              ".jpg",".jpeg",".png",".gif",".zip",".txt",".csv" };

        private const long MaxBytes = 50L * 1024 * 1024;

        public DocumentService(IDocumentRepository repo, IStorageConfigService storage)
        {
            _repo    = repo;
            _storage = storage;
        }

        // ── GET ALL ───────────────────────────────────────────────────────────
        public async Task<ApiResponse<IEnumerable<DocumentResponse>>> GetAllAsync()
        {
            try { return ApiResponse<IEnumerable<DocumentResponse>>.SuccessResponse(await _repo.GetAllAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<DocumentResponse>>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<DocumentResponse>> GetByIdAsync(int id)
        {
            try
            {
                var d = await _repo.GetByIdAsync(id);
                if (d == null) return ApiResponse<DocumentResponse>.ErrorResponse("Not found", 404);
                return ApiResponse<DocumentResponse>.SuccessResponse(d, "OK");
            }
            catch (Exception ex) { return ApiResponse<DocumentResponse>.ErrorResponse(ex.Message); }
        }

        // ── FILTERED ─────────────────────────────────────────────────────────
        public async Task<ApiResponse<IEnumerable<DocumentResponse>>> GetByTaskAsync(int idTask)
        {
            try { return ApiResponse<IEnumerable<DocumentResponse>>.SuccessResponse(await _repo.GetByTaskAsync(idTask), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<DocumentResponse>>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<IEnumerable<DocumentResponse>>> GetByClientAsync(int idClient)
        {
            try { return ApiResponse<IEnumerable<DocumentResponse>>.SuccessResponse(await _repo.GetByClientAsync(idClient), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<DocumentResponse>>.ErrorResponse(ex.Message); }
        }

        // ── SUMMARIES ─────────────────────────────────────────────────────────
        public async Task<ApiResponse<IEnumerable<TaskDocumentSummaryDto>>> GetTaskSummariesAsync()
        {
            try { return ApiResponse<IEnumerable<TaskDocumentSummaryDto>>.SuccessResponse(await _repo.GetTaskSummariesAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<TaskDocumentSummaryDto>>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<IEnumerable<ClientDocumentSummaryDto>>> GetClientSummariesAsync()
        {
            try { return ApiResponse<IEnumerable<ClientDocumentSummaryDto>>.SuccessResponse(await _repo.GetClientSummariesAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<ClientDocumentSummaryDto>>.ErrorResponse(ex.Message); }
        }

        // ── CREATE ────────────────────────────────────────────────────────────
        public async Task<ApiResponse<int>> CreateAsync(CreateDocumentRequest request, IFormFile file, int idUser, string storagePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NameDocument))
                    return ApiResponse<int>.ErrorResponse("Document name is required", 400);
                if (request.IdEmployee <= 0)
                    return ApiResponse<int>.ErrorResponse("Assigned employee is required", 400);
                if (request.IdStatusDocument <= 0)
                    return ApiResponse<int>.ErrorResponse("Status is required", 400);
                if (file == null || file.Length == 0)
                    return ApiResponse<int>.ErrorResponse("File is required", 400);
                if (file.Length > MaxBytes)
                    return ApiResponse<int>.ErrorResponse("File exceeds 50 MB limit", 400);

                var ext = Path.GetExtension(file.FileName);
                if (!AllowedExt.Contains(ext))
                    return ApiResponse<int>.ErrorResponse($"File type '{ext}' is not allowed", 400);

                // Folder is optional — use folder path when available, else fall back to storagePath
                string targetDir = storagePath;
                if (request.IdFolder > 0)
                {
                    var folder = await _repo.GetFolderByIdAsync(request.IdFolder.Value);
                    if (!string.IsNullOrEmpty(folder?.Ruta) && Directory.Exists(folder.Ruta))
                        targetDir = folder.Ruta;
                }

                if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);

                var uniqueName = $"{Guid.NewGuid():N}{ext}";
                var fullPath   = Path.Combine(targetDir, uniqueName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                    await file.CopyToAsync(stream);

                var newId = await _repo.CreateAsync(request, file.FileName, fullPath, idUser);
                if (newId <= 0) return ApiResponse<int>.ErrorResponse("Failed to create document");
                return ApiResponse<int>.SuccessResponse(newId, "Document uploaded successfully", 201);
            }
            catch (Exception ex) { return ApiResponse<int>.ErrorResponse($"Error creating document: {ex.Message}"); }
        }

        // ── UPDATE ────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> UpdateAsync(int id, UpdateDocumentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NameDocument))
                    return ApiResponse<bool>.ErrorResponse("Document name is required", 400);
                if (await _repo.GetByIdAsync(id) == null)
                    return ApiResponse<bool>.ErrorResponse("Not found", 404);
                await _repo.UpdateAsync(id, request);
                return ApiResponse<bool>.SuccessResponse(true, "Document updated");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        // ── DELETE ────────────────────────────────────────────────────────────
        public async Task<ApiResponse<bool>> DeleteAsync(int id)
        {
            try
            {
                if (await _repo.GetByIdAsync(id) == null)
                    return ApiResponse<bool>.ErrorResponse("Not found", 404);
                await _repo.DeleteAsync(id);
                return ApiResponse<bool>.SuccessResponse(true, "Document deleted");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        // ── FOLDERS ───────────────────────────────────────────────────────────
        public async Task<ApiResponse<IEnumerable<FolderResponse>>> GetFoldersAsync()
        {
            try { return ApiResponse<IEnumerable<FolderResponse>>.SuccessResponse(await _repo.GetFoldersAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<FolderResponse>>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<IEnumerable<FolderResponse>>> GetFoldersByClientAsync(int idClient)
        {
            try { return ApiResponse<IEnumerable<FolderResponse>>.SuccessResponse(await _repo.GetFoldersByClientAsync(idClient), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<FolderResponse>>.ErrorResponse(ex.Message); }
        }

        public async Task<ApiResponse<int>> CreateFolderAsync(CreateFolderRequest request, string storagePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<int>.ErrorResponse("Folder name is required", 400);

                string physicalPath = request.IsPrincipal || string.IsNullOrEmpty(request.ParentRuta)
                    ? Path.Combine(storagePath, request.Name)
                    : Path.Combine(request.ParentRuta, request.Name);

                if (!Directory.Exists(physicalPath)) Directory.CreateDirectory(physicalPath);
                request.ParentRuta = physicalPath;

                var newId = await _repo.CreateFolderAsync(request);
                return ApiResponse<int>.SuccessResponse(newId, "Folder created", 201);
            }
            catch (Exception ex) { return ApiResponse<int>.ErrorResponse(ex.Message); }
        }

        // ── AUTO-CREATE TASK FOLDER ───────────────────────────────────────────
        public async Task<bool> CreateTaskFolderAsync(int idTask, string taskName, int? idClient)
        {
            try
            {
                // Skip if folder already exists for this task
                if (await _repo.GetFolderByTaskAsync(idTask) != null) return true;

                var clientName = idClient.HasValue
                    ? await _repo.GetClientNameAsync(idClient.Value) ?? "NO_CLIENT"
                    : "NO_CLIENT";

                var physicalPath = await _storage.ResolveTaskPathAsync(
                    idTask, taskName, clientName, DateTime.Now.Year);

                if (!Directory.Exists(physicalPath)) Directory.CreateDirectory(physicalPath);

                var req = new CreateFolderRequest
                {
                    Name       = $"Task-{idTask} {taskName}",
                    IdClient   = idClient,
                    IdTask     = idTask,
                    IsPrincipal = true,
                    ParentRuta  = physicalPath,
                };
                await _repo.CreateFolderAsync(req);
                return true;
            }
            catch { return false; }
        }

        // ── CATALOGS / DOWNLOAD ───────────────────────────────────────────────
        public async Task<ApiResponse<IEnumerable<DocumentCatalogDto>>> GetCatalogAsync(string tipo)
        {
            try { return ApiResponse<IEnumerable<DocumentCatalogDto>>.SuccessResponse(await _repo.GetCatalogAsync(tipo), "OK"); }
            catch (Exception ex) { return ApiResponse<IEnumerable<DocumentCatalogDto>>.ErrorResponse(ex.Message); }
        }

        public async Task<(string FileName, string RouteFile)?> GetFileInfoAsync(int id)
            => await _repo.GetFileInfoAsync(id);
    }
}
