using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Documents;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _svc;
        private readonly IConfiguration   _config;

        public DocumentsController(IDocumentService svc, IConfiguration config)
        {
            _svc    = svc;
            _config = config;
        }

        private string StoragePath =>
            _config["DocumentSettings:StoragePath"] ?? @"C:\DocumentosServer";

        // ── LIST / GET ────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var r = await _svc.GetAllAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _svc.GetByIdAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── FILTERED QUERIES ──────────────────────────────────────────────────
        [HttpGet("by-task/{idTask:int}")]
        public async Task<IActionResult> GetByTask(int idTask)
        {
            var r = await _svc.GetByTaskAsync(idTask);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpGet("by-client/{idClient:int}")]
        public async Task<IActionResult> GetByClient(int idClient)
        {
            var r = await _svc.GetByClientAsync(idClient);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── SUMMARIES ─────────────────────────────────────────────────────────
        [HttpGet("summaries/tasks")]
        public async Task<IActionResult> GetTaskSummaries()
        {
            var r = await _svc.GetTaskSummariesAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpGet("summaries/clients")]
        public async Task<IActionResult> GetClientSummaries()
        {
            var r = await _svc.GetClientSummariesAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── UPLOAD ────────────────────────────────────────────────────────────
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52_428_800)]
        public async Task<IActionResult> Create([FromForm] CreateDocumentRequest request, IFormFile file)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var r = await _svc.CreateAsync(request, file, GetUserId(), StoragePath);
            return r.Success
                ? CreatedAtAction(nameof(GetById), new { id = r.Data }, r)
                : StatusCode(r.StatusCode, r);
        }

        // ── UPDATE ────────────────────────────────────────────────────────────
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentRequest request)
        {
            var r = await _svc.UpdateAsync(id, request);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── DELETE ────────────────────────────────────────────────────────────
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await _svc.DeleteAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── DOWNLOAD ─────────────────────────────────────────────────────────
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var info = await _svc.GetFileInfoAsync(id);
            if (info == null) return NotFound("File record not found.");

            var (fileName, routeFile) = info.Value;
            if (!System.IO.File.Exists(routeFile))
                return NotFound("Physical file not found on server.");

            var bytes = await System.IO.File.ReadAllBytesAsync(routeFile);
            return File(bytes, ResolveContentType(Path.GetExtension(fileName)), fileName);
        }

        // ── FOLDERS ───────────────────────────────────────────────────────────
        [HttpGet("folders")]
        public async Task<IActionResult> GetFolders()
        {
            var r = await _svc.GetFoldersAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpGet("folders/client/{idClient:int}")]
        public async Task<IActionResult> GetFoldersByClient(int idClient)
        {
            var r = await _svc.GetFoldersByClientAsync(idClient);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        [HttpPost("folders")]
        public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
        {
            var r = await _svc.CreateFolderAsync(request, StoragePath);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // Manually trigger folder creation for an existing task
        [HttpPost("folders/task/{idTask:int}")]
        public async Task<IActionResult> CreateTaskFolder(int idTask)
        {
            var ok = await _svc.CreateTaskFolderAsync(idTask, $"Task-{idTask}", null);
            return ok ? Ok(new { success = true, message = "Folder ensured" })
                      : StatusCode(500, new { success = false, message = "Could not create folder" });
        }

        // ── CATALOGS ─────────────────────────────────────────────────────────
        [HttpGet("catalogs/{tipo}")]
        public async Task<IActionResult> GetCatalog(string tipo)
        {
            var r = await _svc.GetCatalogAsync(tipo);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        // ── HELPERS ──────────────────────────────────────────────────────────
        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private static string ResolveContentType(string ext) => ext.ToLower() switch
        {
            ".pdf"  => "application/pdf",
            ".doc"  => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls"  => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt"  => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"  => "image/png",
            ".gif"  => "image/gif",
            ".zip"  => "application/zip",
            ".txt"  => "text/plain",
            ".csv"  => "text/csv",
            _       => "application/octet-stream",
        };
    }
}
