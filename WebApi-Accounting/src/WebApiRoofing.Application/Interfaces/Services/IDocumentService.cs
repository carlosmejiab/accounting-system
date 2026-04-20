using Microsoft.AspNetCore.Http;
using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Documents;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface IDocumentService
    {
        // ── CRUD ─────────────────────────────────────────────────────────────
        Task<ApiResponse<IEnumerable<DocumentResponse>>> GetAllAsync();
        Task<ApiResponse<DocumentResponse>>              GetByIdAsync(int idDocument);
        Task<ApiResponse<int>>  CreateAsync(CreateDocumentRequest request, IFormFile file, int idUser, string storagePath);
        Task<ApiResponse<bool>> UpdateAsync(int idDocument, UpdateDocumentRequest request);
        Task<ApiResponse<bool>> DeleteAsync(int idDocument);

        // ── Filtered ─────────────────────────────────────────────────────────
        Task<ApiResponse<IEnumerable<DocumentResponse>>> GetByTaskAsync(int idTask);
        Task<ApiResponse<IEnumerable<DocumentResponse>>> GetByClientAsync(int idClient);

        // ── Summaries ────────────────────────────────────────────────────────
        Task<ApiResponse<IEnumerable<TaskDocumentSummaryDto>>>   GetTaskSummariesAsync();
        Task<ApiResponse<IEnumerable<ClientDocumentSummaryDto>>> GetClientSummariesAsync();

        // ── Folders ──────────────────────────────────────────────────────────
        Task<ApiResponse<IEnumerable<FolderResponse>>> GetFoldersAsync();
        Task<ApiResponse<IEnumerable<FolderResponse>>> GetFoldersByClientAsync(int idClient);
        Task<ApiResponse<int>>  CreateFolderAsync(CreateFolderRequest request, string storagePath);
        Task<bool>              CreateTaskFolderAsync(int idTask, string taskName, int? idClient);

        // ── Catalogs / download ───────────────────────────────────────────────
        Task<ApiResponse<IEnumerable<DocumentCatalogDto>>>    GetCatalogAsync(string tipo);
        Task<(string FileName, string RouteFile)?> GetFileInfoAsync(int idDocument);
    }
}
