using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _svc;
    public TasksController(ITaskService svc) => _svc = svc;

    // ═══════════════════════════════════════════════════
    //  CRUD
    // ═══════════════════════════════════════════════════

    [HttpGet]
    public async System.Threading.Tasks.Task<IActionResult> GetAll()
    {
        var r = await _svc.GetAllAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> GetById(int id)
    {
        var r = await _svc.GetByIdAsync(id);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetUserId();
        if (userId == 0) return Unauthorized(new { message = "Usuario no autenticado" });
        var r = await _svc.CreateAsync(request, userId);
        if (!r.Success) return r.StatusCode == 409 ? Conflict(r) : BadRequest(r);
        return CreatedAtAction(nameof(GetById), new { id = r.Data }, r);
    }

    [HttpPut("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetUserId();
        if (userId == 0) return Unauthorized(new { message = "Usuario no autenticado" });
        var r = await _svc.UpdateAsync(id, request, userId);
        if (!r.Success) return r.StatusCode == 409 ? Conflict(r) : BadRequest(r);
        return Ok(r);
    }

    [HttpDelete("{id}")]
    public async System.Threading.Tasks.Task<IActionResult> Delete(int id)
    {
        var r = await _svc.DeleteAsync(id);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════
    //  COMMENTS
    // ═══════════════════════════════════════════════════

    [HttpGet("{id}/comments")]
    public async System.Threading.Tasks.Task<IActionResult> GetComments(int id)
    {
        var r = await _svc.GetCommentsByTaskAsync(id);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id}/comments")]
    public async System.Threading.Tasks.Task<IActionResult> AddComment(int id, [FromBody] CreateCommentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var userId = GetUserId();
        if (userId == 0) return Unauthorized(new { message = "Usuario no autenticado" });
        var r = await _svc.AddCommentAsync(id, request, userId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPut("{id}/comments/{commentId}")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateComment(int id, int commentId, [FromBody] UpdateCommentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var r = await _svc.UpdateCommentAsync(id, commentId, request);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpDelete("{id}/comments/{commentId}")]
    public async System.Threading.Tasks.Task<IActionResult> DeleteComment(int id, int commentId)
    {
        var r = await _svc.DeleteCommentAsync(id, commentId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════
    //  SEARCH
    // ═══════════════════════════════════════════════════

    [HttpPost("search")]
    public async System.Threading.Tasks.Task<IActionResult> Search([FromBody] TaskSearchRequest request)
    {
        var r = await _svc.SearchAsync(request);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════
    //  DUPLICATE VALIDATION
    // ═══════════════════════════════════════════════════

    [HttpPost("validate/exists")]
    public async System.Threading.Tasks.Task<IActionResult> TaskExists([FromBody] TaskExistsRequest request)
    {
        var r = await _svc.TaskExistsAsync(request);
        return Ok(r);
    }

    // ═══════════════════════════════════════════════════
    //  CATALOGS
    // ═══════════════════════════════════════════════════

    [HttpGet("catalogs/groups")]
    public async System.Threading.Tasks.Task<IActionResult> GetGroups()
    {
        var r = await _svc.GetGroupsAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/typetasks")]
    public async System.Threading.Tasks.Task<IActionResult> GetTypeTask()
    {
        var r = await _svc.GetTypeTasksAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/typetasks/group/{groupId}")]
    public async System.Threading.Tasks.Task<IActionResult> GetTypeTasksByGroup(int groupId)
    {
        var r = await _svc.GetTypeTasksByGroupAsync(groupId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/statuses/{typeTaskId}")]
    public async System.Threading.Tasks.Task<IActionResult> GetStatuses(int typeTaskId)
    {
        var r = await _svc.GetStatusByTypeTaskAsync(typeTaskId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/priorities")]
    public async System.Threading.Tasks.Task<IActionResult> GetPriorities()
    {
        var r = await _svc.GetPrioritiesAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/clients")]
    public async System.Threading.Tasks.Task<IActionResult> GetClients()
    {
        var r = await _svc.GetClientsForDropdownAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/clients/search")]
    public async System.Threading.Tasks.Task<IActionResult> GetClientsForSearch()
    {
        var r = await _svc.GetClientsForSearchAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/clients/{clientId}/details")]
    public async System.Threading.Tasks.Task<IActionResult> GetClientDetails(int clientId)
    {
        var r = await _svc.GetClientDetailsAsync(clientId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/contacts/{clientId}")]
    public async System.Threading.Tasks.Task<IActionResult> GetContactsByClient(int clientId)
    {
        var r = await _svc.GetContactsByClientAsync(clientId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/clientaccounts/{clientId}")]
    public async System.Threading.Tasks.Task<IActionResult> GetClientAccounts(int clientId)
    {
        var r = await _svc.GetClientAccountsByClientAsync(clientId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/employees")]
    public async System.Threading.Tasks.Task<IActionResult> GetEmployees()
    {
        var r = await _svc.GetEmployeesAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/locations")]
    public async System.Threading.Tasks.Task<IActionResult> GetLocations()
    {
        var r = await _svc.GetLocationsAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/fiscalyears")]
    public async System.Threading.Tasks.Task<IActionResult> GetFiscalYears()
    {
        var r = await _svc.GetFiscalYearsAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/periods")]
    public async System.Threading.Tasks.Task<IActionResult> GetPeriods()
    {
        var r = await _svc.GetPeriodsAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/visibility/{typeTaskId}")]
    public async System.Threading.Tasks.Task<IActionResult> GetVisibility(int typeTaskId)
    {
        var r = await _svc.CheckTypeTaskVisibilityAsync(typeTaskId);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/statusbilling")]
    public async System.Threading.Tasks.Task<IActionResult> GetStatusBilling()
    {
        var r = await _svc.GetStatusBillingAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("catalogs/checkliststatuses")]
    public async System.Threading.Tasks.Task<IActionResult> GetChecklistStatuses()
    {
        var r = await _svc.GetChecklistStatusOptionsAsync();
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CHECKLIST
    // ═══════════════════════════════════════════════════════════════════

    [HttpGet("{id}/checklist")]
    public async System.Threading.Tasks.Task<IActionResult> GetChecklist(int id)
    {
        var r = await _svc.GetChecklistAsync(id);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPut("{id}/checklist/{itemId}")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateChecklistItem(int id, int itemId, [FromBody] UpdateChecklistItemRequest request)
    {
        var r = await _svc.UpdateChecklistItemAsync(itemId, request);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPost("{id}/checklist/notify")]
    public async System.Threading.Tasks.Task<IActionResult> SendNotification(int id, [FromBody] SendNotificationRequest request)
    {
        var r = await _svc.SendNotificationAsync(id, request);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  NOTIFICATION HISTORY
    // ═══════════════════════════════════════════════════════════════════

    [HttpGet("{id}/notifications")]
    public async System.Threading.Tasks.Task<IActionResult> GetNotificationHistory(int id)
    {
        var r = await _svc.GetNotificationHistoryAsync(id);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  NOTIFICATION SETTINGS
    // ═══════════════════════════════════════════════════════════════════

    [HttpGet("catalogs/notificationsettings/{tipo}")]
    public async System.Threading.Tasks.Task<IActionResult> GetNotificationSettingCatalog(string tipo)
    {
        var r = await _svc.GetNotificationSettingCatalogAsync(tipo);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpGet("{id}/notifications/settings")]
    public async System.Threading.Tasks.Task<IActionResult> GetNotificationSettings(int id)
    {
        var r = await _svc.GetNotificationSettingsAsync(id);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpPut("{id}/notifications/settings")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateNotificationSetting(int id, [FromBody] UpdateNotificationSettingRequest request)
    {
        var r = await _svc.UpdateNotificationSettingAsync(id, request);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    // ─── private ─────────────────────────────────────────────────────────────
    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }
}
