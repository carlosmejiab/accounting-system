using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Repositories;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly string _connectionString;

        public TaskRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new ArgumentNullException(nameof(configuration));
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  HELPERS
        // ═══════════════════════════════════════════════════════════════════════

        // Used by usp_AyE_Task_GetAll — columns: ClientName, StatusName, PriorityName, AssignedTo, NameGroup, FiscalYear(int)
        private static TaskListItemDto MapListItem(SqlDataReader r) => new()
        {
            IdTask           = r.GetInt32("IdTask"),
            Name             = r.IsDBNull("Name")            ? null : r.GetString("Name"),
            ClientName       = r.IsDBNull("ClientName")      ? null : r.GetString("ClientName"),
            ClientAccount    = r.IsDBNull("ClientAccount")   ? null : r.GetString("ClientAccount"),
            TypeTask         = r.IsDBNull("TypeTask")        ? null : r.GetString("TypeTask"),
            StatusName       = r.IsDBNull("StatusName")      ? null : r.GetString("StatusName"),
            PriorityName     = r.IsDBNull("PriorityName")    ? null : r.GetString("PriorityName"),
            AssignedTo       = r.IsDBNull("AssignedTo")      ? null : r.GetString("AssignedTo"),
            NameGroup        = r.IsDBNull("NameGroup")       ? null : r.GetString("NameGroup"),
            FiscalYear       = r.IsDBNull("FiscalYear")      ? null : r.GetInt32("FiscalYear"),
            StartDateTime    = r.IsDBNull("StartDateTime")   ? null : r.GetDateTime("StartDateTime"),
            DueDateTime      = r.IsDBNull("DueDateTime")     ? null : r.GetDateTime("DueDateTime"),
            State            = r.IsDBNull("State")           ? "1"  : r.GetString("State").Trim(),
            CreationDate     = r.IsDBNull("CreationDate")    ? null : r.GetDateTime("CreationDate"),
            ModificationDate = r.IsDBNull("ModificationDate") ? null : r.GetDateTime("ModificationDate")
        };

        // Used by search SPs (usp_AyE_Listar_NumTask / Entre_fechas / Por_Periodo / Client_Task)
        // Those SPs use different aliases: 'Client', 'Status', 'Priority', FiscalYear as string
        // Safe helpers — return null/default if the column doesn't exist in the current SP result set
        private static string? SafeStr(SqlDataReader r, string col)
        {
            for (int i = 0; i < r.FieldCount; i++)
                if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase))
                    return r.IsDBNull(i) ? null : r.GetString(i);
            return null;
        }
        private static DateTime? SafeDt(SqlDataReader r, string col)
        {
            for (int i = 0; i < r.FieldCount; i++)
                if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase))
                    return r.IsDBNull(i) ? null : r.GetDateTime(i);
            return null;
        }

        private static TaskListItemDto MapSearchItem(SqlDataReader r) => new()
        {
            IdTask           = r.GetInt32("IdTask"),
            Name             = SafeStr(r, "Name"),
            ClientName       = SafeStr(r, "Client"),
            ClientAccount    = SafeStr(r, "ClientAccount"),
            TypeTask         = SafeStr(r, "TypeTask"),
            StatusName       = SafeStr(r, "Status"),
            PriorityName     = SafeStr(r, "Priority"),
            AssignedTo       = null,   // not returned by search SPs
            NameGroup        = null,   // not returned by search SPs
            FiscalYear       = null,   // search SPs return FiscalYear as a string description
            StartDateTime    = SafeDt(r, "StartDateTime"),
            DueDateTime      = SafeDt(r, "DueDateTime"),
            State            = SafeStr(r, "State")?.Trim() ?? "1",
            CreationDate     = SafeDt(r, "CreationDate"),
            ModificationDate = SafeDt(r, "ModificationDate"),
        };

        private static (int dia, int horas, int minutos) DecomposeEstimate(int? estimate)
        {
            int e = estimate ?? 0;
            return (e / 1440, (e % 1440) / 60, e % 60);
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CRUD - GET ALL
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<TaskListItemDto>> GetAllAsync()
        {
            var tasks = new List<TaskListItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task_GetAll", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) tasks.Add(MapListItem(r));
            return tasks;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CRUD - GET BY ID
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<TaskDetailResponse?> GetByIdAsync(int id)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return null;

            int? rawEstimate = r.IsDBNull("Estimate") ? null : r.GetInt32("Estimate");
            var (dia, horas, minutos) = DecomposeEstimate(rawEstimate);

            return new TaskDetailResponse
            {
                IdTask            = r.GetInt32("IdTask"),
                Name              = r.IsDBNull("Name")              ? null : r.GetString("Name"),
                IdClient          = r.IsDBNull("IdClient")          ? null : r.GetInt32("IdClient"),
                IdGroup           = r.IsDBNull("IdGroup")           ? null : r.GetInt32("IdGroup"),
                IdTypeTask        = r.IsDBNull("IdTypeTask")        ? null : r.GetInt32("IdTypeTask"),
                IdEmployee        = r.IsDBNull("IdEmployee")        ? null : r.GetInt32("IdEmployee"),
                IdStatus          = r.IsDBNull("IdStatus")          ? null : r.GetInt32("IdStatus"),
                IdLocation        = r.IsDBNull("IdLocation")        ? null : r.GetInt32("IdLocation"),
                IdContact         = r.IsDBNull("IdContact")         ? null : r.GetInt32("IdContact"),
                IdPriority        = r.IsDBNull("IdPriority")        ? null : r.GetInt32("IdPriority"),
                IdClientAccount   = r.IsDBNull("IdClientAccount")   ? null : r.GetInt32("IdClientAccount"),
                IdParentTask      = r.IsDBNull("IdParentTask")      ? null : r.GetInt32("IdParentTask"),
                ClientName        = r.IsDBNull("ClientName")        ? null : r.GetString("ClientName"),
                TypeTask          = r.IsDBNull("TypeTask")          ? null : r.GetString("TypeTask"),
                EmployeeName      = r.IsDBNull("EmployeeName")      ? null : r.GetString("EmployeeName"),
                StatusName        = r.IsDBNull("StatusName")        ? null : r.GetString("StatusName"),
                PriorityName      = r.IsDBNull("PriorityName")      ? null : r.GetString("PriorityName"),
                CreatedByEmployee = r.IsDBNull("CreatedByEmployee") ? null : r.GetString("CreatedByEmployee"),
                NameGroup         = r.IsDBNull("NameGroup")         ? null : r.GetString("NameGroup"),
                Location          = r.IsDBNull("Location")          ? null : r.GetString("Location"),
                FiscalYearStr     = r.IsDBNull("FiscalYearStr")     ? null : r.GetString("FiscalYearStr"),
                FirstNameContact  = r.IsDBNull("FirstNameContact")  ? null : r.GetString("FirstNameContact"),
                ClienteAccount    = r.IsDBNull("ClienteAccount")    ? null : r.GetString("ClienteAccount"),
                Estimate          = rawEstimate,
                Dia               = dia,
                Horas             = horas,
                Minutos           = minutos,
                Description       = r.IsDBNull("Description")       ? null : r.GetString("Description"),
                State             = r.IsDBNull("State")             ? "1"  : r.GetString("State").Trim(),
                FiscalYear        = r.IsDBNull("FiscalYear")        ? null : r.GetInt32("FiscalYear"),
                PolicyExpDate     = r.IsDBNull("PolicyExpDate")     ? null : r.GetDateTime("PolicyExpDate"),
                DatePaid          = r.IsDBNull("DatePaid")          ? null : r.GetDateTime("DatePaid"),
                StartDateTime     = r.IsDBNull("StartDateTime")     ? null : r.GetDateTime("StartDateTime"),
                DueDateTime       = r.IsDBNull("DueDateTime")       ? null : r.GetDateTime("DueDateTime"),
                CreationDate      = r.IsDBNull("CreationDate")      ? null : r.GetDateTime("CreationDate"),
                ModificationDate  = r.IsDBNull("ModificationDate")  ? null : r.GetDateTime("ModificationDate")
            };
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CRUD - CREATE
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<int> CreateAsync(CrmTask task)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task", con) { CommandType = CommandType.StoredProcedure };

            // SP returns new ID via SELECT SCOPE_IDENTITY() — use ExecuteScalar (same as original DAO)
            cmd.Parameters.AddWithValue("@IdTask", 0);
            AddTaskParams(cmd, task);
            cmd.Parameters.AddWithValue("@TIPO", (byte)1);

            var result = await cmd.ExecuteScalarAsync();
            return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CRUD - UPDATE
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<bool> UpdateAsync(CrmTask task)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", task.IdTask);
            AddTaskParams(cmd, task);
            cmd.Parameters.AddWithValue("@TIPO", (byte)2);
            var rows = await cmd.ExecuteNonQueryAsync();
            return rows >= 0;  // UPDATE may return 0 rows affected yet succeed
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CRUD - DELETE (soft)
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<bool> DeleteAsync(int id)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask",          id);
            cmd.Parameters.AddWithValue("@IdClient",        DBNull.Value);
            cmd.Parameters.AddWithValue("@IdTypeTask",      DBNull.Value);
            cmd.Parameters.AddWithValue("@IdEmployee",      DBNull.Value);
            cmd.Parameters.AddWithValue("@IdStatus",        DBNull.Value);
            cmd.Parameters.AddWithValue("@IdLocation",      DBNull.Value);
            cmd.Parameters.AddWithValue("@IdParentTask",    DBNull.Value);
            cmd.Parameters.AddWithValue("@IdContact",       DBNull.Value);
            cmd.Parameters.AddWithValue("@IdPriority",      DBNull.Value);
            cmd.Parameters.AddWithValue("@Name",            "");
            cmd.Parameters.AddWithValue("@StartDateTime",   DBNull.Value);
            cmd.Parameters.AddWithValue("@DueDateTime",     DBNull.Value);
            cmd.Parameters.AddWithValue("@Estimate",        DBNull.Value);
            cmd.Parameters.AddWithValue("@Description",     DBNull.Value);
            cmd.Parameters.AddWithValue("@State",           "0");
            cmd.Parameters.AddWithValue("@FiscalYear",      DBNull.Value);
            cmd.Parameters.AddWithValue("@IdClientAccount", DBNull.Value);
            cmd.Parameters.AddWithValue("@IdEmployeeCreate",DBNull.Value);
            cmd.Parameters.AddWithValue("@IdGroup",         DBNull.Value);
            cmd.Parameters.AddWithValue("@PolicyExpDate",   DBNull.Value);
            cmd.Parameters.AddWithValue("@DatePaid",        DBNull.Value);
            cmd.Parameters.AddWithValue("@TIPO",            (byte)3);
            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        private static void AddTaskParams(SqlCommand cmd, CrmTask t)
        {
            cmd.Parameters.AddWithValue("@IdClient",         (object?)t.IdClient         ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdTypeTask",       (object?)t.IdTypeTask       ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdEmployee",       (object?)t.IdEmployee       ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdStatus",         (object?)t.IdStatus         ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdLocation",       (object?)t.IdLocation       ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdParentTask",     (object?)t.IdParentTask     ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdContact",        (object?)t.IdContact        ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdPriority",       (object?)t.IdPriority       ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Name",             (object?)t.Name             ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@StartDateTime",    (object?)t.StartDateTime    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DueDateTime",      (object?)t.DueDateTime      ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Estimate",         (object?)t.Estimate         ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Description",      (object?)t.Description      ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@State",            t.State);
            cmd.Parameters.AddWithValue("@FiscalYear",       (object?)t.FiscalYear       ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdClientAccount",  (object?)t.IdClientAccount  ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdEmployeeCreate", (object?)t.IdEmployeeCreate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdGroup",          (object?)t.IdGroup          ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PolicyExpDate",    (object?)t.PolicyExpDate    ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DatePaid",         (object?)t.DatePaid         ?? DBNull.Value);
            // NOTE: @CreationDate and @ModificationDate are NOT SP params — handled via GETDATE() inside usp_AyE_Task.
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  COMMENTS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<TaskCommentResponse>> GetCommentsByTaskAsync(int taskId)
        {
            var list = new List<TaskCommentResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_TaskComment_ListByTask", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TaskCommentResponse
                {
                    IdComment    = r.GetInt32("IdComment"),
                    IdTask       = r.GetInt32("IdTask"),
                    IdEmployee   = r.GetInt32("IdEmployee"),
                    EmployeeName = r.IsDBNull("EmployeeName") ? string.Empty : r.GetString("EmployeeName"),
                    Comment      = r.GetString("Comment"),
                    CommentDate  = r.GetDateTime("CommentDate"),
                    IsDeleted    = false
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task<int> AddCommentAsync(TaskComment comment)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_TaskComment_Insert", con) { CommandType = CommandType.StoredProcedure };
            var idParam = new SqlParameter("@IdComment", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(idParam);
            cmd.Parameters.AddWithValue("@IdTask",      comment.IdTask);
            cmd.Parameters.AddWithValue("@IdEmployee",  comment.IdEmployee);
            cmd.Parameters.AddWithValue("@Comment",     comment.Comment);
            cmd.Parameters.AddWithValue("@CommentDate", comment.CommentDate);
            await cmd.ExecuteNonQueryAsync();
            return idParam.Value != DBNull.Value ? Convert.ToInt32(idParam.Value) : 0;
        }

        public async System.Threading.Tasks.Task<bool> UpdateCommentAsync(TaskComment comment)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_TaskComment_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdComment", comment.IdComment);
            cmd.Parameters.AddWithValue("@Comment",   comment.Comment);
            var rows = await cmd.ExecuteNonQueryAsync();
            return rows >= 0;
        }

        public async System.Threading.Tasks.Task<bool> DeleteCommentAsync(int commentId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_TaskComment_Delete", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdComment", commentId);
            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  PARTICIPANTS
        //  usp_AyE_Listar_Task_Participantes returns ALL employees with State flag
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetParticipantsByTaskAsync(int taskId)
        {
            var list = new List<EmployeeSelectionDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Task_Participantes", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EmployeeSelectionDto
                {
                    IdEmployee = r.GetInt32("IdEmployee"),
                    FullName   = r.IsDBNull("Employees") ? string.Empty : r.GetString("Employees"),
                    State      = !r.IsDBNull("State") && Convert.ToInt32(r.GetValue("State")) == 1
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task AddParticipantAsync(int taskId, int employeeId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            // usp_AyE_Update_Task_Participants: upsert — UPDATE if exists, INSERT if new, @State CHAR(1)
            using var cmd = new SqlCommand("usp_AyE_Update_Task_Participants", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@State",      "1");
            cmd.Parameters.AddWithValue("@IdTask",     taskId);
            cmd.Parameters.AddWithValue("@IdEmployee", employeeId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task ResetParticipantsStateAsync(int taskId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("UPDATE TaskPacticipants SET State = '0' WHERE IdTask = @IdTask", con);
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            await cmd.ExecuteNonQueryAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  SUPERVISORS
        //  usp_AyE_Listar_TaskSupervisor returns ALL employees with State flag
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetSupervisorsByTaskAsync(int taskId)
        {
            var list = new List<EmployeeSelectionDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_TaskSupervisor", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EmployeeSelectionDto
                {
                    IdEmployee = r.GetInt32("IdEmployee"),
                    FullName   = r.IsDBNull("Employees") ? string.Empty : r.GetString("Employees"),
                    State      = !r.IsDBNull("State") && Convert.ToInt32(r.GetValue("State")) == 1
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task AddSupervisorAsync(int taskId, int employeeId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            // usp_AyE_Update_Task_Supervisors: upsert — UPDATE if exists, INSERT if new, @State CHAR(1)
            using var cmd = new SqlCommand("usp_AyE_Update_Task_Supervisors", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@State",      "1");
            cmd.Parameters.AddWithValue("@IdTask",     taskId);
            cmd.Parameters.AddWithValue("@IdEmployee", employeeId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task ResetSupervisorsStateAsync(int taskId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("UPDATE TaskSupervisor SET State = '0' WHERE IdTask = @IdTask", con);
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            await cmd.ExecuteNonQueryAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  APPOINTMENTS (ApptWith)
        //  usp_AyE_Listar_TaskAppointment returns ALL employees with State flag
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<EmployeeSelectionDto>> GetAppointmentsByTaskAsync(int taskId)
        {
            var list = new List<EmployeeSelectionDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_TaskAppointment", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EmployeeSelectionDto
                {
                    IdEmployee = r.GetInt32("IdEmployee"),
                    FullName   = r.IsDBNull("Employees") ? string.Empty : r.GetString("Employees"),
                    State      = !r.IsDBNull("State") && Convert.ToInt32(r.GetValue("State")) == 1
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task AddAppointmentAsync(int taskId, int employeeId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            // usp_AyE_Update_Task_Citas: upsert — UPDATE if exists, INSERT if new, @State CHAR(1)
            using var cmd = new SqlCommand("usp_AyE_Update_Task_Citas", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@State",      "1");
            cmd.Parameters.AddWithValue("@IdTask",     taskId);
            cmd.Parameters.AddWithValue("@IdEmployee", employeeId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task ResetAppointmentsStateAsync(int taskId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("UPDATE TaskAppointment SET State = '0' WHERE IdTask = @IdTask", con);
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            await cmd.ExecuteNonQueryAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CATALOGS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<TypeTaskResponse>> GetTypeTasksAsync()
        {
            var list = new List<TypeTaskResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_GetTypeTasksAsync", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TypeTaskResponse { IdTypeTask = r.GetInt32("IdTypeTask"), Name = r.GetString("Name") });
            return list;
        }

        public async System.Threading.Tasks.Task<List<TypeTaskResponse>> GetTypeTasksByGroupAsync(int groupId)
        {
            var list = new List<TypeTaskResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_ListarComboTipoTareaPorGrupo", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdGroup", groupId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TypeTaskResponse { IdTypeTask = r.GetInt32("IdTypeTask"), Name = r.GetString("Name") });
            return list;
        }

        // usp_GetStatusPorTypeTask returns IdTabla, Description (from TablaMaestra)
        public async System.Threading.Tasks.Task<List<TaskStatusResponse>> GetStatusByTypeTaskAsync(int typeTaskId)
        {
            var list = new List<TaskStatusResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_GetStatusPorTypeTask", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTypeTask", typeTaskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TaskStatusResponse
                {
                    IdTabla     = r.GetInt32("IdTabla"),
                    Description = r.GetString("Description")
                });
            return list;
        }

        // usp_AyE_Listar_Status_Billing — Billing-specific statuses
        public async System.Threading.Tasks.Task<List<TaskStatusResponse>> GetStatusBillingAsync()
        {
            var list = new List<TaskStatusResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Status_Billing", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TaskStatusResponse
                {
                    IdTabla     = r.GetInt32("IdTabla"),
                    Description = r.GetString("Description")
                });
            return list;
        }

        public async System.Threading.Tasks.Task<List<PriorityResponse>> GetPrioritiesAsync()
        {
            var list = new List<PriorityResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_GetPrioritiesAsync", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new PriorityResponse { IdTabla = r.GetInt32("IdTabla"), Description = r.GetString("Description") });
            return list;
        }

        public async System.Threading.Tasks.Task<List<TaskClientResponse>> GetClientsForDropdownAsync()
        {
            var list = new List<TaskClientResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task_GetClientsDropdown", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TaskClientResponse { IdClient = r.GetInt32("IdClient"), Name = r.GetString("Name") });
            return list;
        }

        public async System.Threading.Tasks.Task<List<TaskClientResponse>> GetClientsForSearchAsync()
        {
            var list = new List<TaskClientResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("ListarClienteTask", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new TaskClientResponse { IdClient = r.GetInt32("IdClient"), Name = r.GetString("Name") });
            return list;
        }

        // usp_AyE_Contact_GetByClient returns IdContact, FirstName (from MContactxCliente)
        public async System.Threading.Tasks.Task<List<TaskContactResponse>> GetContactsByClientAsync(int clientId)
        {
            var list = new List<TaskContactResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Contact_GetByClient", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdClient", clientId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TaskContactResponse
                {
                    IdContact = r.GetInt32("IdContact"),
                    FirstName = r.IsDBNull("FirstName") ? string.Empty : r.GetString("FirstName")
                });
            }
            return list;
        }

        // usp_AyE_Task_GetClientAccounts returns IdClientAccount, AccountNumber
        public async System.Threading.Tasks.Task<List<TaskClientAccountResponse>> GetClientAccountsByClientAsync(int clientId)
        {
            var list = new List<TaskClientAccountResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Task_GetClientAccounts", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdClient", clientId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                var acct = r.IsDBNull("AccountNumber") ? string.Empty : r.GetString("AccountNumber");
                var bank = r.IsDBNull("BankName")      ? string.Empty : r.GetString("BankName");
                list.Add(new TaskClientAccountResponse
                {
                    IdClientAccount = r.GetInt32("IdClientAccount"),
                    ClienteAccount  = string.IsNullOrEmpty(bank) ? acct : $"{acct} - {bank}"
                });
            }
            return list;
        }

        // ListarGroup returns IdGroup, NameGroup
        public async System.Threading.Tasks.Task<List<GroupResponse>> GetGroupsAsync()
        {
            var list = new List<GroupResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("ListarGroup", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new GroupResponse
                {
                    IdGroup   = r.GetInt32("IdGroup"),
                    NameGroup = r.IsDBNull("NameGroup") ? string.Empty : r.GetString("NameGroup")
                });
            return list;
        }

        // Direct SQL — equivalent to usp_GetEmployees but avoids SP version mismatch
        public async System.Threading.Tasks.Task<List<EmployeeDropdownResponse>> GetEmployeesAsync()
        {
            var list = new List<EmployeeDropdownResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                @"SELECT IdEmployee,
                         LastName + ' ' + FirstName AS FullName
                  FROM   dbo.Employees
                  WHERE  State = '1'
                  ORDER BY LastName ASC", con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EmployeeDropdownResponse
                {
                    IdEmployee = r.GetInt32("IdEmployee"),
                    FullName   = r.IsDBNull("FullName") ? string.Empty : r.GetString("FullName")
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task<List<LocationItemResponse>> GetLocationsAsync()
        {
            var list = new List<LocationItemResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_GetLocationsCatalog", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new LocationItemResponse { IdTabla = r.GetInt32("IdTabla"), Description = r.GetString("Description") });
            return list;
        }

        public async System.Threading.Tasks.Task<List<FiscalYearItemResponse>> GetFiscalYearsAsync()
        {
            var list = new List<FiscalYearItemResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_GetFiscalYearsCatalog", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new FiscalYearItemResponse { IdTabla = r.GetInt32("IdTabla"), Description = r.GetString("Description") });
            return list;
        }

        // ListarPeriodoTask returns IdTabla (int), Description
        public async System.Threading.Tasks.Task<List<PeriodResponse>> GetPeriodsAsync()
        {
            var list = new List<PeriodResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("ListarPeriodoTask", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new PeriodResponse
                {
                    IdTabla     = r.GetInt32("IdTabla"),
                    Description = r.IsDBNull("Description") ? string.Empty : r.GetString("Description")
                });
            return list;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  VISIBILITY CHECK
        //  usp_CheckMasterTableRecord @Group ('ApptWith'|'DatePaid'), @Description (TypeTask NAME)
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<TypeTaskVisibilityResponse> CheckTypeTaskVisibilityAsync(int typeTaskId)
        {
            var result = new TypeTaskVisibilityResponse();

            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            // Look up the TypeTask name first
            string typeTaskName = string.Empty;
            using (var nameCmd = new SqlCommand("SELECT Name FROM TypeTask WHERE IdTypeTask = @Id", con))
            {
                nameCmd.Parameters.AddWithValue("@Id", typeTaskId);
                var nameVal = await nameCmd.ExecuteScalarAsync();
                typeTaskName = nameVal?.ToString() ?? string.Empty;
            }

            if (string.IsNullOrEmpty(typeTaskName))
                return result;

            async System.Threading.Tasks.Task<bool> Check(string group)
            {
                using var cmd = new SqlCommand("usp_CheckMasterTableRecord", con) { CommandType = CommandType.StoredProcedure };
                cmd.Parameters.AddWithValue("@Group",       group);
                cmd.Parameters.AddWithValue("@Description", typeTaskName);
                var scalar = await cmd.ExecuteScalarAsync();
                return scalar != null && scalar != DBNull.Value && Convert.ToInt32(scalar) > 0;
            }

            result.ShowApptWith = await Check("ApptWith");
            result.ShowDatePaid = await Check("DatePaid");

            return result;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  SEARCH
        // ═══════════════════════════════════════════════════════════════════════
        // usp_AyE_Listar_NumTask  @DetalleNumTask VARCHAR
        public async System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByNumbersAsync(string numbers)
        {
            var list = new List<TaskListItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_NumTask", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@DetalleNumTask", numbers);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapSearchItem(r));
            return list;
        }

        // usp_AyE_Listar_Entre_fechas  @TIPO VARCHAR, @id INT, @InicioDate DATE, @findate DATE
        public async System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByDateRangeAsync(DateTime from, DateTime to)
        {
            var list = new List<TaskListItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Entre_fechas", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@TIPO",       "MTask");
            cmd.Parameters.AddWithValue("@id",         0);
            cmd.Parameters.AddWithValue("@InicioDate", from.Date);
            cmd.Parameters.AddWithValue("@findate",    to.Date);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapSearchItem(r));
            return list;
        }

        // usp_AyE_Listar_Por_Periodo  @id INT (period IdTabla), @IdCliente INT (0 = all)
        public async System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByPeriodAsync(int periodId)
        {
            var list = new List<TaskListItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Por_Periodo", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@id",        periodId);
            cmd.Parameters.AddWithValue("@IdCliente", 0);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapSearchItem(r));
            return list;
        }

        // usp_AyE_Listar_Client_Task  @id INT (clientId), @InicioDate DATE, @findate DATE
        // Use wide date range to return all tasks for the client
        public async System.Threading.Tasks.Task<List<TaskListItemDto>> SearchByClientAsync(int clientId)
        {
            var list = new List<TaskListItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Listar_Client_Task", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@id",         clientId);
            cmd.Parameters.AddWithValue("@InicioDate", new DateTime(1900, 1, 1));
            cmd.Parameters.AddWithValue("@findate",    new DateTime(2099, 12, 31));
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapSearchItem(r));
            return list;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  DUPLICATE VALIDATION
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<bool> TaskExistsAsync(string name, int idTypeTask, int idClient)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                "SELECT COUNT(1) FROM Task WHERE [Name] = @Name AND IdTypeTask = @IdTypeTask AND IdClient = @IdClient AND LTRIM(RTRIM(State)) != '0'",
                con);
            cmd.Parameters.AddWithValue("@Name",       name);
            cmd.Parameters.AddWithValue("@IdTypeTask", idTypeTask);
            cmd.Parameters.AddWithValue("@IdClient",   idClient);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async System.Threading.Tasks.Task<bool> TaskExistsForUpdateAsync(int idTask, string name, int idTypeTask, int idClient)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                "SELECT COUNT(1) FROM Task WHERE [Name] = @Name AND IdTypeTask = @IdTypeTask AND IdClient = @IdClient AND IdTask != @IdTask AND LTRIM(RTRIM(State)) != '0'",
                con);
            cmd.Parameters.AddWithValue("@IdTask",     idTask);
            cmd.Parameters.AddWithValue("@Name",       name);
            cmd.Parameters.AddWithValue("@IdTypeTask", idTypeTask);
            cmd.Parameters.AddWithValue("@IdClient",   idClient);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  CHECKLIST
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<ChecklistItemDto>> GetChecklistAsync(int taskId)
        {
            var list = new List<ChecklistItemDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_GetChecklistData", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ChecklistItemDto
                {
                    IdTaskDocumentCheckList = r.GetInt32("IdTaskDocumentCheckList"),
                    DocumentName            = r.IsDBNull("DocumentName") ? string.Empty : r.GetString("DocumentName"),
                    IsChecked               = !r.IsDBNull("IsChecked") && Convert.ToBoolean(r.GetValue("IsChecked")),
                    Status                  = r.IsDBNull("Status")       ? string.Empty : r.GetString("Status"),
                    CodStatus               = r.IsDBNull("CodStatus")    ? 0            : Convert.ToInt32(r.GetValue("CodStatus")),
                    Notes                   = r.IsDBNull("Notes")        ? null : r.GetString("Notes"),
                    Notification            = r.IsDBNull("Notification") ? null : Convert.ToString(r.GetValue("Notification")),
                    ReceivedDate            = r.IsDBNull("ReceivedDate") ? null : r.GetDateTime("ReceivedDate"),
                    User                    = r.IsDBNull("User")         ? null : r.GetString("User"),
                });
            }
            return list;
        }

        public async System.Threading.Tasks.Task UpdateChecklistStatusAsync(int itemId, int statusId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_UpdateChecklistStatus", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTaskDocumentCheckList", itemId);
            cmd.Parameters.AddWithValue("@StatusId", statusId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task UpdateChecklistCheckAsync(int itemId, bool isChecked)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_UpdateChecklistCheck", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTaskDocumentCheckList", itemId);
            cmd.Parameters.AddWithValue("@IsChecked", isChecked);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task UpdateChecklistReceivedDateAsync(int itemId, DateTime? receivedDate)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_UpdateReceivedDate", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTaskDocumentCheckList", itemId);
            cmd.Parameters.AddWithValue("@ReceivedDate", receivedDate.HasValue ? (object)receivedDate.Value : DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task UpdateChecklistNotesAsync(int itemId, string? notes)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_UpdateNotes", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTaskDocumentCheckList", itemId);
            cmd.Parameters.AddWithValue("@Notes", (object?)notes ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        public async System.Threading.Tasks.Task<List<ChecklistStatusOptionDto>> GetChecklistStatusOptionsAsync()
        {
            var list = new List<ChecklistStatusOptionDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_GetStatusOptions", con) { CommandType = CommandType.StoredProcedure };
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new ChecklistStatusOptionDto
                {
                    IdTabla     = r.GetInt32("IdTabla"),
                    Description = r.IsDBNull("Description") ? string.Empty : r.GetString("Description"),
                });
            return list;
        }

        public async System.Threading.Tasks.Task MarkChecklistItemAsNotifiedAsync(int itemId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_UpdateTaskDocumentCheckListStatus", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTaskDocumentCheckList", itemId);
            cmd.Parameters.AddWithValue("@Status", 220);
            await cmd.ExecuteNonQueryAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  NOTIFICATION HISTORY
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<NotificationHistoryDto>> GetNotificationHistoryAsync(int taskId)
        {
            var list = new List<NotificationHistoryDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_GetNotificationHistoryByTaskId", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdTask", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new NotificationHistoryDto
                {
                    FechaHora    = r.IsDBNull("FechaHora")    ? null : r.GetDateTime("FechaHora"),
                    MetodoEnvio  = r.IsDBNull("MetodoEnvio")  ? null : r.GetString("MetodoEnvio"),
                    Destinatario = r.IsDBNull("Destinatario") ? null : r.GetString("Destinatario"),
                    Estado       = r.IsDBNull("Estado")       ? null : r.GetString("Estado"),
                    Descripcion  = r.IsDBNull("Descripcion")  ? null : r.GetString("Descripcion"),
                });
            }
            return list;
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  NOTIFICATION SETTINGS
        // ═══════════════════════════════════════════════════════════════════════
        public async System.Threading.Tasks.Task<List<NotificationSettingCatalogDto>> GetNotificationSettingCatalogAsync(string tipo)
        {
            var list = new List<NotificationSettingCatalogDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_ListarTablasNotificationSettings", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@TIPO", tipo);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
                list.Add(new NotificationSettingCatalogDto
                {
                    IdTabla     = Convert.ToInt32(r.GetValue("IdTabla")),
                    Description = r.IsDBNull("Description") ? string.Empty : r.GetString("Description"),
                });
            return list;
        }

        public async System.Threading.Tasks.Task<NotificationSettingsDto?> GetNotificationSettingsAsync(int taskId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("GetNotificationSettingsByTaskId", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@TaskId", taskId);
            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return new NotificationSettingsDto();
            return new NotificationSettingsDto
            {
                DeliveryMethod        = r.IsDBNull("DeliveryMethod")        ? null : r.GetValue("DeliveryMethod").ToString(),
                FrequencyDelivery     = r.IsDBNull("FrequencyDelivery")     ? null : r.GetValue("FrequencyDelivery").ToString(),
                DeliveryDate          = r.IsDBNull("DeliveryDate")          ? null : r.GetDateTime("DeliveryDate"),
                ConditionsNotification = r.IsDBNull("ConditionsNotification") ? null : r.GetValue("ConditionsNotification").ToString(),
            };
        }

        public async System.Threading.Tasks.Task UpdateNotificationSettingAsync(int taskId, string tipo, string? value)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("updateNotificationSettings", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@TaskId", taskId);
            cmd.Parameters.AddWithValue("@Valor", string.IsNullOrEmpty(value) ? DBNull.Value : (object)value);
            cmd.Parameters.AddWithValue("@Tipo", tipo);
            await cmd.ExecuteNonQueryAsync();
        }

        // ── Client Detail ──────────────────────────────────────────────────────
        public async System.Threading.Tasks.Task<ClientDetailDto?> GetClientDetailAsync(int clientId)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("dbo.Client_GetDetailsById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@IdClient", clientId);
            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return null;
            return new ClientDetailDto
            {
                Name    = r.IsDBNull("Name")    ? null : r.GetString("Name"),
                Email   = r.IsDBNull("Email")   ? null : r.GetString("Email"),
                Phone   = r.IsDBNull("Phone")   ? null : r.GetString("Phone"),
                Address = r.IsDBNull("Address") ? null : r.GetString("Address"),
            };
        }
    }
}
