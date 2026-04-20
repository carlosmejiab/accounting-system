using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Repositories
{
    public interface ITaskRepository
    {
        // ── CRUD ──────────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<TaskListItemDto>>  GetAllAsync();
        System.Threading.Tasks.Task<TaskDetailResponse?>    GetByIdAsync(int id);
        System.Threading.Tasks.Task<int>                    CreateAsync(CrmTask task);
        System.Threading.Tasks.Task<bool>                   UpdateAsync(CrmTask task);
        System.Threading.Tasks.Task<bool>                   DeleteAsync(int id);

        // ── Comments ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<TaskCommentResponse>> GetCommentsByTaskAsync(int taskId);
        System.Threading.Tasks.Task<int>                       AddCommentAsync(TaskComment comment);
        System.Threading.Tasks.Task<bool>                      UpdateCommentAsync(TaskComment comment);
        System.Threading.Tasks.Task<bool>                      DeleteCommentAsync(int commentId);

        // ── Participants  (returns ALL employees with assignment state) ────────
        System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetParticipantsByTaskAsync(int taskId);
        System.Threading.Tasks.Task                             AddParticipantAsync(int taskId, int employeeId);
        System.Threading.Tasks.Task                             ResetParticipantsStateAsync(int taskId);

        // ── Supervisors ────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetSupervisorsByTaskAsync(int taskId);
        System.Threading.Tasks.Task                             AddSupervisorAsync(int taskId, int employeeId);
        System.Threading.Tasks.Task                             ResetSupervisorsStateAsync(int taskId);

        // ── Appointments (ApptWith) ────────────────────────────────────────────
        System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetAppointmentsByTaskAsync(int taskId);
        System.Threading.Tasks.Task                             AddAppointmentAsync(int taskId, int employeeId);
        System.Threading.Tasks.Task                             ResetAppointmentsStateAsync(int taskId);

        // ── Catalogs ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<TypeTaskResponse>>          GetTypeTasksAsync();
        System.Threading.Tasks.Task<List<TypeTaskResponse>>          GetTypeTasksByGroupAsync(int groupId);
        System.Threading.Tasks.Task<List<TaskStatusResponse>>        GetStatusByTypeTaskAsync(int typeTaskId);
        System.Threading.Tasks.Task<List<TaskStatusResponse>>        GetStatusBillingAsync();
        System.Threading.Tasks.Task<List<PriorityResponse>>          GetPrioritiesAsync();
        System.Threading.Tasks.Task<List<TaskClientResponse>>        GetClientsForDropdownAsync();
        System.Threading.Tasks.Task<List<TaskClientResponse>>        GetClientsForSearchAsync();
        System.Threading.Tasks.Task<List<TaskContactResponse>>       GetContactsByClientAsync(int clientId);
        System.Threading.Tasks.Task<List<TaskClientAccountResponse>> GetClientAccountsByClientAsync(int clientId);
        System.Threading.Tasks.Task<List<GroupResponse>>             GetGroupsAsync();
        System.Threading.Tasks.Task<List<EmployeeDropdownResponse>>  GetEmployeesAsync();
        System.Threading.Tasks.Task<List<LocationItemResponse>>      GetLocationsAsync();
        System.Threading.Tasks.Task<List<FiscalYearItemResponse>>    GetFiscalYearsAsync();
        System.Threading.Tasks.Task<List<PeriodResponse>>            GetPeriodsAsync();

        // ── Visibility (conditional form fields) ──────────────────────────────
        System.Threading.Tasks.Task<TypeTaskVisibilityResponse> CheckTypeTaskVisibilityAsync(int typeTaskId);

        // ── Search ────────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByNumbersAsync(string numbers);
        System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByDateRangeAsync(DateTime from, DateTime to);
        System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByPeriodAsync(int periodId);
        System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByClientAsync(int clientId);

        // ── Duplicate validation ───────────────────────────────────────────────
        System.Threading.Tasks.Task<bool> TaskExistsAsync(string name, int idTypeTask, int idClient);
        System.Threading.Tasks.Task<bool> TaskExistsForUpdateAsync(int idTask, string name, int idTypeTask, int idClient);

        // ── Checklist ──────────────────────────────────────────────────────────
        System.Threading.Tasks.Task<List<ChecklistItemDto>>          GetChecklistAsync(int taskId);
        System.Threading.Tasks.Task                                  UpdateChecklistStatusAsync(int itemId, int statusId);
        System.Threading.Tasks.Task                                  UpdateChecklistCheckAsync(int itemId, bool isChecked);
        System.Threading.Tasks.Task                                  UpdateChecklistReceivedDateAsync(int itemId, DateTime? receivedDate);
        System.Threading.Tasks.Task                                  UpdateChecklistNotesAsync(int itemId, string? notes);
        System.Threading.Tasks.Task<List<ChecklistStatusOptionDto>>  GetChecklistStatusOptionsAsync();
        System.Threading.Tasks.Task                                  MarkChecklistItemAsNotifiedAsync(int itemId);

        // ── Notification History ───────────────────────────────────────────────
        System.Threading.Tasks.Task<List<NotificationHistoryDto>> GetNotificationHistoryAsync(int taskId);

        // ── Notification Settings ──────────────────────────────────────────────
        System.Threading.Tasks.Task<List<NotificationSettingCatalogDto>> GetNotificationSettingCatalogAsync(string tipo);
        System.Threading.Tasks.Task<NotificationSettingsDto?>            GetNotificationSettingsAsync(int taskId);
        System.Threading.Tasks.Task                                      UpdateNotificationSettingAsync(int taskId, string tipo, string? value);

        // ── Client Detail ──────────────────────────────────────────────────────
        System.Threading.Tasks.Task<ClientDetailDto?> GetClientDetailAsync(int clientId);
    }
}
