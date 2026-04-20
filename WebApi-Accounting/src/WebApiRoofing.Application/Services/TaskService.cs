using WebApiRoofing.Application.DTOs.Common;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository    _repo;
        private readonly IDocumentService   _docService;

        public TaskService(ITaskRepository repo, IDocumentService docService)
        {
            _repo       = repo;
            _docService = docService;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  GET ALL
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<TaskListItemDto>>> GetAllAsync()
        {
            try
            {
                var data = await _repo.GetAllAsync();
                return ApiResponse<List<TaskListItemDto>>.SuccessResponse(data, "Tareas obtenidas correctamente");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<TaskListItemDto>>.ErrorResponse($"Error al obtener tareas: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  GET BY ID
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<TaskDetailResponse>> GetByIdAsync(int id)
        {
            try
            {
                var task = await _repo.GetByIdAsync(id);
                if (task == null)
                    return ApiResponse<TaskDetailResponse>.ErrorResponse("Tarea no encontrada", 404);

                // Load related data in parallel
                var commentsTask       = _repo.GetCommentsByTaskAsync(id);
                var participantsTask   = _repo.GetParticipantsByTaskAsync(id);
                var supervisorsTask    = _repo.GetSupervisorsByTaskAsync(id);
                var appointmentsTask   = _repo.GetAppointmentsByTaskAsync(id);

                await System.Threading.Tasks.Task.WhenAll(commentsTask, participantsTask, supervisorsTask, appointmentsTask);

                task.Comments      = commentsTask.Result;
                task.Participants  = participantsTask.Result;
                task.Supervisors   = supervisorsTask.Result;
                task.Appointments  = appointmentsTask.Result;

                return ApiResponse<TaskDetailResponse>.SuccessResponse(task, "Tarea obtenida correctamente");
            }
            catch (Exception ex)
            {
                return ApiResponse<TaskDetailResponse>.ErrorResponse($"Error al obtener tarea: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CREATE
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<int>> CreateAsync(CreateTaskRequest request, int userId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<int>.ErrorResponse("El nombre de la tarea es requerido", 400);

                if (request.DueDateTime.HasValue && request.StartDateTime.HasValue
                    && request.DueDateTime < request.StartDateTime)
                    return ApiResponse<int>.ErrorResponse("La fecha de vencimiento no puede ser anterior a la fecha de inicio", 400);

                // Duplicate check
                var exists = await _repo.TaskExistsAsync(request.Name.Trim(), request.IdTypeTask, request.IdClient);
                if (exists)
                    return ApiResponse<int>.ErrorResponse("Ya existe una tarea con el mismo nombre, tipo y cliente", 409);

                var now = DateTime.Now;
                var task = new CrmTask
                {
                    IdClient         = request.IdClient,
                    IdGroup          = request.IdGroup,
                    IdTypeTask       = request.IdTypeTask,
                    IdEmployee       = request.IdEmployee,
                    IdStatus         = request.IdStatus,
                    IdLocation       = request.IdLocation,
                    IdContact        = request.IdContact,
                    IdPriority       = request.IdPriority,
                    IdClientAccount  = request.IdClientAccount,
                    IdParentTask     = request.IdParentTask,
                    Name             = request.Name.Trim(),
                    StartDateTime    = request.StartDateTime,
                    DueDateTime      = request.DueDateTime,
                    Estimate         = ComputeEstimate(request.Dia, request.Horas, request.Minutos),
                    Description      = request.Description?.Trim(),
                    State            = request.IsActive ? "1" : "0",
                    FiscalYear       = request.FiscalYear,
                    PolicyExpDate    = request.PolicyExpDate,
                    DatePaid         = request.DatePaid,
                    IdEmployeeCreate = userId > 0 ? userId : null,
                    CreationDate     = now,
                    ModificationDate = now
                };

                var newId = await _repo.CreateAsync(task);
                if (newId == 0)
                    return ApiResponse<int>.ErrorResponse("No se pudo crear la tarea", 500);

                // Save multi-selects
                await SaveMultiSelectsAsync(newId, request.ParticipantIds, request.SupervisorIds, request.AppointmentIds);

                // Auto-create document folder for this task (fire-and-forget, never blocks task creation)
                _ = System.Threading.Tasks.Task.Run(() =>
                    _docService.CreateTaskFolderAsync(newId, request.Name.Trim(), request.IdClient));

                return ApiResponse<int>.SuccessResponse(newId, "Tarea creada correctamente", 201);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse($"Error al crear tarea: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  UPDATE
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<bool>> UpdateAsync(int id, UpdateTaskRequest request, int userId)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(id);
                if (existing == null)
                    return ApiResponse<bool>.ErrorResponse("Tarea no encontrada", 404);

                if (string.IsNullOrWhiteSpace(request.Name))
                    return ApiResponse<bool>.ErrorResponse("El nombre de la tarea es requerido", 400);

                if (request.DueDateTime.HasValue && request.StartDateTime.HasValue
                    && request.DueDateTime < request.StartDateTime)
                    return ApiResponse<bool>.ErrorResponse("La fecha de vencimiento no puede ser anterior a la fecha de inicio", 400);

                // Duplicate check (excluding self)
                var exists = await _repo.TaskExistsForUpdateAsync(id, request.Name.Trim(), request.IdTypeTask, request.IdClient);
                if (exists)
                    return ApiResponse<bool>.ErrorResponse("Ya existe otra tarea con el mismo nombre, tipo y cliente", 409);

                var task = new CrmTask
                {
                    IdTask           = id,
                    IdClient         = request.IdClient,
                    IdGroup          = request.IdGroup,
                    IdTypeTask       = request.IdTypeTask,
                    IdEmployee       = request.IdEmployee,
                    IdStatus         = request.IdStatus,
                    IdLocation       = request.IdLocation,
                    IdContact        = request.IdContact,
                    IdPriority       = request.IdPriority,
                    IdClientAccount  = request.IdClientAccount,
                    IdParentTask     = request.IdParentTask,
                    Name             = request.Name.Trim(),
                    StartDateTime    = request.StartDateTime,
                    DueDateTime      = request.DueDateTime,
                    Estimate         = ComputeEstimate(request.Dia, request.Horas, request.Minutos),
                    Description      = request.Description?.Trim(),
                    State            = request.IsActive ? "1" : "0",
                    FiscalYear       = request.FiscalYear,
                    PolicyExpDate    = request.PolicyExpDate,
                    DatePaid         = request.DatePaid,
                    IdEmployeeCreate = userId > 0 ? userId : null,
                    CreationDate     = existing.CreationDate ?? DateTime.Now,
                    ModificationDate = DateTime.Now
                };

                var updated = await _repo.UpdateAsync(task);
                if (!updated)
                    return ApiResponse<bool>.ErrorResponse("No se pudo actualizar la tarea", 500);

                // Reset and re-save multi-selects
                await SaveMultiSelectsAsync(id, request.ParticipantIds, request.SupervisorIds, request.AppointmentIds);

                return ApiResponse<bool>.SuccessResponse(true, "Tarea actualizada correctamente");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error al actualizar tarea: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  DELETE
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse> DeleteAsync(int id)
        {
            try
            {
                var existing = await _repo.GetByIdAsync(id);
                if (existing == null)
                    return new ApiResponse { Success = false, Message = "Tarea no encontrada", StatusCode = 404 };

                var deleted = await _repo.DeleteAsync(id);
                if (!deleted)
                    return new ApiResponse { Success = false, Message = "No se pudo eliminar la tarea", StatusCode = 500 };

                return new ApiResponse { Success = true, Message = "Tarea eliminada correctamente", StatusCode = 200 };
            }
            catch (Exception ex)
            {
                return new ApiResponse { Success = false, Message = $"Error al eliminar tarea: {ex.Message}", StatusCode = 500 };
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  COMMENTS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<TaskCommentResponse>>> GetCommentsByTaskAsync(int taskId)
        {
            try
            {
                var data = await _repo.GetCommentsByTaskAsync(taskId);
                return ApiResponse<List<TaskCommentResponse>>.SuccessResponse(data, "Comentarios obtenidos");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<TaskCommentResponse>>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<int>> AddCommentAsync(int taskId, CreateCommentRequest request, int userId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Comment))
                    return ApiResponse<int>.ErrorResponse("El comentario no puede estar vacío", 400);

                var comment = new TaskComment
                {
                    IdTask      = taskId,
                    IdEmployee  = userId,
                    Comment     = request.Comment.Trim(),
                    CommentDate = DateTime.Now,
                    IsDeleted   = false
                };
                var newId = await _repo.AddCommentAsync(comment);
                return ApiResponse<int>.SuccessResponse(newId, "Comentario agregado correctamente", 201);
            }
            catch (Exception ex)
            {
                return ApiResponse<int>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse<bool>> UpdateCommentAsync(int taskId, int commentId, UpdateCommentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Comment))
                    return ApiResponse<bool>.ErrorResponse("El comentario no puede estar vacío", 400);

                var comment = new TaskComment { IdComment = commentId, IdTask = taskId, Comment = request.Comment.Trim() };
                var ok = await _repo.UpdateCommentAsync(comment);
                if (!ok) return ApiResponse<bool>.ErrorResponse("No se pudo actualizar el comentario", 500);
                return ApiResponse<bool>.SuccessResponse(true, "Comentario actualizado correctamente");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse($"Error: {ex.Message}");
            }
        }

        public async System.Threading.Tasks.Task<ApiResponse> DeleteCommentAsync(int taskId, int commentId)
        {
            try
            {
                var ok = await _repo.DeleteCommentAsync(commentId);
                if (!ok) return new ApiResponse { Success = false, Message = "No se pudo eliminar el comentario", StatusCode = 500 };
                return new ApiResponse { Success = true, Message = "Comentario eliminado correctamente", StatusCode = 200 };
            }
            catch (Exception ex)
            {
                return new ApiResponse { Success = false, Message = $"Error: {ex.Message}", StatusCode = 500 };
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CATALOGS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<TypeTaskResponse>>> GetTypeTasksAsync()
        {
            try { return ApiResponse<List<TypeTaskResponse>>.SuccessResponse(await _repo.GetTypeTasksAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TypeTaskResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TypeTaskResponse>>> GetTypeTasksByGroupAsync(int groupId)
        {
            try { return ApiResponse<List<TypeTaskResponse>>.SuccessResponse(await _repo.GetTypeTasksByGroupAsync(groupId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TypeTaskResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskStatusResponse>>> GetStatusByTypeTaskAsync(int typeTaskId)
        {
            try { return ApiResponse<List<TaskStatusResponse>>.SuccessResponse(await _repo.GetStatusByTypeTaskAsync(typeTaskId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskStatusResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskStatusResponse>>> GetStatusBillingAsync()
        {
            try { return ApiResponse<List<TaskStatusResponse>>.SuccessResponse(await _repo.GetStatusBillingAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskStatusResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<PriorityResponse>>> GetPrioritiesAsync()
        {
            try { return ApiResponse<List<PriorityResponse>>.SuccessResponse(await _repo.GetPrioritiesAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<PriorityResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskClientResponse>>> GetClientsForDropdownAsync()
        {
            try { return ApiResponse<List<TaskClientResponse>>.SuccessResponse(await _repo.GetClientsForDropdownAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskClientResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskClientResponse>>> GetClientsForSearchAsync()
        {
            try { return ApiResponse<List<TaskClientResponse>>.SuccessResponse(await _repo.GetClientsForSearchAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskClientResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskContactResponse>>> GetContactsByClientAsync(int clientId)
        {
            try { return ApiResponse<List<TaskContactResponse>>.SuccessResponse(await _repo.GetContactsByClientAsync(clientId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskContactResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<TaskClientAccountResponse>>> GetClientAccountsByClientAsync(int clientId)
        {
            try { return ApiResponse<List<TaskClientAccountResponse>>.SuccessResponse(await _repo.GetClientAccountsByClientAsync(clientId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<TaskClientAccountResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<GroupResponse>>> GetGroupsAsync()
        {
            try { return ApiResponse<List<GroupResponse>>.SuccessResponse(await _repo.GetGroupsAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<GroupResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<EmployeeDropdownResponse>>> GetEmployeesAsync()
        {
            try { return ApiResponse<List<EmployeeDropdownResponse>>.SuccessResponse(await _repo.GetEmployeesAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<EmployeeDropdownResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<LocationItemResponse>>> GetLocationsAsync()
        {
            try { return ApiResponse<List<LocationItemResponse>>.SuccessResponse(await _repo.GetLocationsAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<LocationItemResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<FiscalYearItemResponse>>> GetFiscalYearsAsync()
        {
            try { return ApiResponse<List<FiscalYearItemResponse>>.SuccessResponse(await _repo.GetFiscalYearsAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<FiscalYearItemResponse>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<PeriodResponse>>> GetPeriodsAsync()
        {
            try { return ApiResponse<List<PeriodResponse>>.SuccessResponse(await _repo.GetPeriodsAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<PeriodResponse>>.ErrorResponse(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  VISIBILITY
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<TypeTaskVisibilityResponse>> CheckTypeTaskVisibilityAsync(int typeTaskId)
        {
            try { return ApiResponse<TypeTaskVisibilityResponse>.SuccessResponse(await _repo.CheckTypeTaskVisibilityAsync(typeTaskId), "OK"); }
            catch (Exception ex) { return ApiResponse<TypeTaskVisibilityResponse>.ErrorResponse(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  SEARCH
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<TaskListItemDto>>> SearchAsync(TaskSearchRequest request)
        {
            try
            {
                List<TaskListItemDto> data = request.Mode switch
                {
                    "numbers" when !string.IsNullOrWhiteSpace(request.Numbers)
                        => await _repo.SearchByNumbersAsync(request.Numbers),
                    "dates" when request.DateFrom.HasValue && request.DateTo.HasValue
                        => await _repo.SearchByDateRangeAsync(request.DateFrom.Value, request.DateTo.Value),
                    "period" when request.PeriodId.HasValue
                        => await _repo.SearchByPeriodAsync(request.PeriodId.Value),
                    "client" when request.ClientId.HasValue
                        => await _repo.SearchByClientAsync(request.ClientId.Value),
                    _ => await _repo.GetAllAsync()
                };
                return ApiResponse<List<TaskListItemDto>>.SuccessResponse(data, "Búsqueda completada");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<TaskListItemDto>>.ErrorResponse($"Error en búsqueda: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  DUPLICATE VALIDATION
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<bool>> TaskExistsAsync(TaskExistsRequest request)
        {
            try
            {
                bool exists = request.IdTask.HasValue
                    ? await _repo.TaskExistsForUpdateAsync(request.IdTask.Value, request.Name, request.IdTypeTask, request.IdClient)
                    : await _repo.TaskExistsAsync(request.Name, request.IdTypeTask, request.IdClient);
                return ApiResponse<bool>.SuccessResponse(exists, exists ? "La tarea ya existe" : "Nombre disponible");
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.ErrorResponse(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════════════
        private static int? ComputeEstimate(int? dia, int? horas, int? minutos)
        {
            int total = (dia ?? 0) * 1440 + (horas ?? 0) * 60 + (minutos ?? 0);
            return total > 0 ? total : null;
        }

        private async System.Threading.Tasks.Task SaveMultiSelectsAsync(
            int taskId,
            List<int> participantIds,
            List<int> supervisorIds,
            List<int> appointmentIds)
        {
            // Reset all first, then add
            await _repo.ResetParticipantsStateAsync(taskId);
            foreach (var empId in participantIds)
                await _repo.AddParticipantAsync(taskId, empId);

            await _repo.ResetSupervisorsStateAsync(taskId);
            foreach (var empId in supervisorIds)
                await _repo.AddSupervisorAsync(taskId, empId);

            await _repo.ResetAppointmentsStateAsync(taskId);
            foreach (var empId in appointmentIds)
                await _repo.AddAppointmentAsync(taskId, empId);
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CHECKLIST
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<ChecklistItemDto>>> GetChecklistAsync(int taskId)
        {
            try { return ApiResponse<List<ChecklistItemDto>>.SuccessResponse(await _repo.GetChecklistAsync(taskId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<ChecklistItemDto>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<bool>> UpdateChecklistItemAsync(int itemId, UpdateChecklistItemRequest request)
        {
            try
            {
                // Mirror original: UpdateChecklistStatus + UpdateChecklistCheck (isChecked = 221 or 222)
                bool isChecked = request.StatusId == 221 || request.StatusId == 222;
                await _repo.UpdateChecklistStatusAsync(itemId, request.StatusId);
                await _repo.UpdateChecklistCheckAsync(itemId, isChecked);
                await _repo.UpdateChecklistReceivedDateAsync(itemId, request.ReceivedDate);
                if (request.Notes != null)
                    await _repo.UpdateChecklistNotesAsync(itemId, request.Notes);
                return ApiResponse<bool>.SuccessResponse(true, "Checklist actualizado");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<List<ChecklistStatusOptionDto>>> GetChecklistStatusOptionsAsync()
        {
            try { return ApiResponse<List<ChecklistStatusOptionDto>>.SuccessResponse(await _repo.GetChecklistStatusOptionsAsync(), "OK"); }
            catch (Exception ex) { return ApiResponse<List<ChecklistStatusOptionDto>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<bool>> SendNotificationAsync(int taskId, SendNotificationRequest request)
        {
            try
            {
                foreach (var id in request.ChecklistItemIds)
                    await _repo.MarkChecklistItemAsNotifiedAsync(id);
                return ApiResponse<bool>.SuccessResponse(true, "Notificación enviada");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  NOTIFICATION HISTORY
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<NotificationHistoryDto>>> GetNotificationHistoryAsync(int taskId)
        {
            try { return ApiResponse<List<NotificationHistoryDto>>.SuccessResponse(await _repo.GetNotificationHistoryAsync(taskId), "OK"); }
            catch (Exception ex) { return ApiResponse<List<NotificationHistoryDto>>.ErrorResponse(ex.Message); }
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  NOTIFICATION SETTINGS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<ApiResponse<List<NotificationSettingCatalogDto>>> GetNotificationSettingCatalogAsync(string tipo)
        {
            try { return ApiResponse<List<NotificationSettingCatalogDto>>.SuccessResponse(await _repo.GetNotificationSettingCatalogAsync(tipo), "OK"); }
            catch (Exception ex) { return ApiResponse<List<NotificationSettingCatalogDto>>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<NotificationSettingsDto>> GetNotificationSettingsAsync(int taskId)
        {
            try
            {
                var data = await _repo.GetNotificationSettingsAsync(taskId);
                return ApiResponse<NotificationSettingsDto>.SuccessResponse(data ?? new NotificationSettingsDto(), "OK");
            }
            catch (Exception ex) { return ApiResponse<NotificationSettingsDto>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<bool>> UpdateNotificationSettingAsync(int taskId, UpdateNotificationSettingRequest request)
        {
            try
            {
                await _repo.UpdateNotificationSettingAsync(taskId, request.Tipo, request.Value);
                return ApiResponse<bool>.SuccessResponse(true, "OK");
            }
            catch (Exception ex) { return ApiResponse<bool>.ErrorResponse(ex.Message); }
        }

        public async System.Threading.Tasks.Task<ApiResponse<ClientDetailDto>> GetClientDetailsAsync(int clientId)
        {
            try
            {
                var data = await _repo.GetClientDetailAsync(clientId);
                return data != null
                    ? ApiResponse<ClientDetailDto>.SuccessResponse(data, "OK")
                    : ApiResponse<ClientDetailDto>.ErrorResponse("Cliente no encontrado");
            }
            catch (Exception ex) { return ApiResponse<ClientDetailDto>.ErrorResponse(ex.Message); }
        }
    }
}
