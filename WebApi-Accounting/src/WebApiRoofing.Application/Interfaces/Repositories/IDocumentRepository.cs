using WebApiRoofing.Application.DTOs.Documents;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface IDocumentRepository
    {
        // ── Basic CRUD ────────────────────────────────────────────────────────
        Task<IEnumerable<DocumentResponse>> GetAllAsync();
        Task<DocumentResponse?>             GetByIdAsync(int idDocument);
        Task<int>  CreateAsync(CreateDocumentRequest request, string fileName, string routeFile, int idUser);
        Task<bool> UpdateAsync(int idDocument, UpdateDocumentRequest request);
        Task<bool> DeleteAsync(int idDocument);

        // ── Filtered queries ──────────────────────────────────────────────────
        Task<IEnumerable<DocumentResponse>> GetByTaskAsync(int idTask);
        Task<IEnumerable<DocumentResponse>> GetByClientAsync(int idClient);

        // ── Summaries for overview panels ─────────────────────────────────────
        Task<IEnumerable<TaskDocumentSummaryDto>>   GetTaskSummariesAsync();
        Task<IEnumerable<ClientDocumentSummaryDto>> GetClientSummariesAsync();

        // ── Folders ───────────────────────────────────────────────────────────
        Task<IEnumerable<FolderResponse>> GetFoldersAsync();
        Task<FolderResponse?>             GetFolderByIdAsync(int idFolder);
        Task<FolderResponse?>             GetFolderByTaskAsync(int idTask);
        Task<IEnumerable<FolderResponse>> GetFoldersByClientAsync(int idClient);
        Task<int>  CreateFolderAsync(CreateFolderRequest request);

        // ── Catalogs / helpers ────────────────────────────────────────────────
        Task<IEnumerable<DocumentCatalogDto>>    GetCatalogAsync(string tipo);
        Task<(string FileName, string RouteFile)?> GetFileInfoAsync(int idDocument);
        Task<string?> GetClientNameAsync(int idClient);
    }
}
