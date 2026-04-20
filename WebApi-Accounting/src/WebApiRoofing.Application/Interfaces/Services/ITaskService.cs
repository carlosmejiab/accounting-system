using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Tasks;

namespace WebApiRoofing.Application.Interfaces.Services
{
    public interface ITaskService
    {
        // ── CRUD ──────────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<TaskListItemDto>>> GetAllAsync();
        System.Threading.Tasks.Task<ApiResponse<TaskDetailResponse>>    GetByIdAsync(int id);
        System.Threading.Tasks.Task<ApiResponse<int>>                   CreateAsync(CreateTaskRequest request, int userId);
        System.Threading.Tasks.Task<ApiResponse<bool>>                  UpdateAsync(int id, UpdateTaskRequest request, int userId);
        System.Threading.Tasks.Task<ApiResponse>                        DeleteAsync(int id);

        // ── Comments ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<TaskCommentResponse>>> GetCommentsByTaskAsync(int taskId);
        System.Threading.Tasks.Task<ApiResponse<int>>                       AddCommentAsync(int taskId, CreateCommentRequest request, int userId);
        System.Threading.Tasks.Task<ApiResponse<bool>>                      UpdateCommentAsync(int taskId, int commentId, UpdateCommentRequest request);
        System.Threading.Tasks.Task<ApiResponse>                            DeleteCommentAsync(int taskId, int commentId);

        // ── Catalogs ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<TypeTaskResponse>>>         GetTypeTasksAsync();
        System.Threading.Tasks.Task<ApiResponse<List<TypeTaskResponse>>>         GetTypeTasksByGroupAsync(int groupId);
        System.Threading.Tasks.Task<ApiResponse<List<TaskStatusResponse>>>       GetStatusByTypeTaskAsync(int typeTaskId);
        System.Threading.Tasks.Task<ApiResponse<List<TaskStatusResponse>>>       GetStatusBillingAsync();
        System.Threading.Tasks.Task<ApiResponse<List<PriorityResponse>>>         GetPrioritiesAsync();
        System.Threading.Tasks.Task<ApiResponse<List<TaskClientResponse>>>       GetClientsForDropdownAsync();
        System.Threading.Tasks.Task<ApiResponse<List<TaskClientResponse>>>       GetClientsForSearchAsync();
        System.Threading.Tasks.Task<ApiResponse<List<TaskContactResponse>>>      GetContactsByClientAsync(int clientId);
        System.Threading.Tasks.Task<ApiResponse<List<TaskClientAccountResponse>>> GetClientAccountsByClientAsync(int clientId);
        System.Threading.Tasks.Task<ApiResponse<List<GroupResponse>>>            GetGroupsAsync();
        System.Threading.Tasks.Task<ApiResponse<List<EmployeeDropdownResponse>>> GetEmployeesAsync();
        System.Threading.Tasks.Task<ApiResponse<List<LocationItemResponse>>>     GetLocationsAsync();
        System.Threading.Tasks.Task<ApiResponse<List<FiscalYearItemResponse>>>   GetFiscalYearsAsync();
        System.Threading.Tasks.Task<ApiResponse<List<PeriodResponse>>>           GetPeriodsAsync();

        // ── Visibility ────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<TypeTaskVisibilityResponse>> CheckTypeTaskVisibilityAsync(int typeTaskId);

        // ── Search ────────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<TaskListItemDto>>> SearchAsync(TaskSearchRequest request);

        // ── Duplicate validation ───────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<bool>> TaskExistsAsync(TaskExistsRequest request);

        // ── Checklist ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<ChecklistItemDto>>>         GetChecklistAsync(int taskId);
        System.Threading.Tasks.Task<ApiResponse<bool>>                           UpdateChecklistItemAsync(int itemId, UpdateChecklistItemRequest request);
        System.Threading.Tasks.Task<ApiResponse<List<ChecklistStatusOptionDto>>> GetChecklistStatusOptionsAsync();
        System.Threading.Tasks.Task<ApiResponse<bool>>                           SendNotificationAsync(int taskId, SendNotificationRequest request);

        // ── Notification History ───────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<NotificationHistoryDto>>> GetNotificationHistoryAsync(int taskId);

        // ── Notification Settings ──────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<List<NotificationSettingCatalogDto>>> GetNotificationSettingCatalogAsync(string tipo);
        System.Threading.Tasks.Task<ApiResponse<NotificationSettingsDto>>             GetNotificationSettingsAsync(int taskId);
        System.Threading.Tasks.Task<ApiResponse<bool>>                                UpdateNotificationSettingAsync(int taskId, UpdateNotificationSettingRequest request);

        // ── Client Detail ──────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ApiResponse<ClientDetailDto>> GetClientDetailsAsync(int clientId);
    }
}
