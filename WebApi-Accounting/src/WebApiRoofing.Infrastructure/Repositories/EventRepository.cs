using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using WebApiRoofing.Application.DTOs.Events;
using WebApiRoofing.Application.Interfaces.Repositories;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class EventRepository : IEventRepository
    {
        private readonly string _connectionString;

        public EventRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET ALL  (direct SQL — all active events, no employee filter)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EventResponse>> GetAllAsync(int idEmployee)
        {
            const string sql = @"
                SELECT a.IdEvent, a.IdStatusEvent, a.IdActivityType, a.IdLocation,
                       a.IdPriority, a.IdTask, a.IdClient, a.Name,
                       a.StartDateTime, a.DueDateTime, a.Descripction,
                       a.State, a.IdFrequency, a.IdEmployeeCreate,
                       b.Description AS Status,
                       c.Description AS ActivityType,
                       d.Description AS Location,
                       e.Description AS Priority,
                       f.Description AS Task,
                       g.Name        AS Client
                FROM   Event a
                LEFT   JOIN TablaMaestra b ON b.IdTabla = a.IdStatusEvent
                LEFT   JOIN TablaMaestra c ON c.IdTabla = a.IdActivityType
                LEFT   JOIN TablaMaestra d ON d.IdTabla = a.IdLocation
                LEFT   JOIN TablaMaestra e ON e.IdTabla = a.IdPriority
                LEFT   JOIN Task         f ON f.IdTask   = a.IdTask
                LEFT   JOIN Client       g ON g.IdClient = a.IdClient
                WHERE  a.State = '1'
                ORDER  BY a.StartDateTime DESC";

            var list = new List<EventResponse>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);

            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EventResponse
                {
                    IdEvent          = r.GetInt32(r.GetOrdinal("IdEvent")),
                    IdStatusEvent    = r.IsDBNull(r.GetOrdinal("IdStatusEvent"))   ? null : r.GetInt32(r.GetOrdinal("IdStatusEvent")),
                    IdActivityType   = r.IsDBNull(r.GetOrdinal("IdActivityType"))  ? null : r.GetInt32(r.GetOrdinal("IdActivityType")),
                    IdLocation       = r.IsDBNull(r.GetOrdinal("IdLocation"))      ? null : r.GetInt32(r.GetOrdinal("IdLocation")),
                    IdPriority       = r.IsDBNull(r.GetOrdinal("IdPriority"))      ? null : r.GetInt32(r.GetOrdinal("IdPriority")),
                    IdTask           = r.IsDBNull(r.GetOrdinal("IdTask"))           ? null : r.GetInt32(r.GetOrdinal("IdTask")),
                    IdClient         = r.IsDBNull(r.GetOrdinal("IdClient"))         ? null : r.GetInt32(r.GetOrdinal("IdClient")),
                    Name             = r.IsDBNull(r.GetOrdinal("Name"))             ? string.Empty : r.GetString(r.GetOrdinal("Name")),
                    StartDateTime    = r.GetDateTime(r.GetOrdinal("StartDateTime")),
                    DueDateTime      = r.GetDateTime(r.GetOrdinal("DueDateTime")),
                    Description      = r.IsDBNull(r.GetOrdinal("Descripction"))    ? null : r.GetString(r.GetOrdinal("Descripction")),
                    State            = r.IsDBNull(r.GetOrdinal("State"))            ? null : Convert.ToString(r.GetValue(r.GetOrdinal("State"))),
                    IdFrequency      = r.IsDBNull(r.GetOrdinal("IdFrequency"))      ? null : r.GetInt32(r.GetOrdinal("IdFrequency")),
                    IdEmployeeCreate = r.IsDBNull(r.GetOrdinal("IdEmployeeCreate")) ? null : r.GetInt32(r.GetOrdinal("IdEmployeeCreate")),
                    Status           = r.IsDBNull(r.GetOrdinal("Status"))           ? null : r.GetString(r.GetOrdinal("Status")),
                    ActivityType     = r.IsDBNull(r.GetOrdinal("ActivityType"))     ? null : r.GetString(r.GetOrdinal("ActivityType")),
                    Location         = r.IsDBNull(r.GetOrdinal("Location"))         ? null : r.GetString(r.GetOrdinal("Location")),
                    Priority         = r.IsDBNull(r.GetOrdinal("Priority"))         ? null : r.GetString(r.GetOrdinal("Priority")),
                    TaskName         = r.IsDBNull(r.GetOrdinal("Task"))             ? null : r.GetString(r.GetOrdinal("Task")),
                    ClientName       = r.IsDBNull(r.GetOrdinal("Client"))           ? null : r.GetString(r.GetOrdinal("Client")),
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET BY ID  (inline SQL — no SP for single event)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<EventResponse?> GetByIdAsync(int idEvent)
        {
            const string sql = @"
                SELECT a.IdEvent, a.IdStatusEvent, a.IdActivityType, a.IdLocation,
                       a.IdPriority, a.IdTask, a.IdClient, a.Name,
                       a.StartDateTime, a.DueDateTime, a.Descripction,
                       a.State, a.IdFrequency, a.IdEmployeeCreate,
                       b.Description AS Status,
                       c.Description AS ActivityType,
                       d.Description AS Location,
                       e.Description AS Priority,
                       f.Description AS Task,
                       g.Name        AS Client
                FROM   Event a
                LEFT   JOIN TablaMaestra b ON b.IdTabla = a.IdStatusEvent
                LEFT   JOIN TablaMaestra c ON c.IdTabla = a.IdActivityType
                LEFT   JOIN TablaMaestra d ON d.IdTabla = a.IdLocation
                LEFT   JOIN TablaMaestra e ON e.IdTabla = a.IdPriority
                LEFT   JOIN Task         f ON f.IdTask  = a.IdTask
                LEFT   JOIN Client       g ON g.IdClient = a.IdClient
                WHERE  a.IdEvent = @IdEvent";

            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdEvent", idEvent);

            using var r = await cmd.ExecuteReaderAsync();
            if (!await r.ReadAsync()) return null;

            return new EventResponse
            {
                IdEvent          = r.GetInt32(r.GetOrdinal("IdEvent")),
                IdStatusEvent    = r.IsDBNull(r.GetOrdinal("IdStatusEvent"))   ? null : r.GetInt32(r.GetOrdinal("IdStatusEvent")),
                IdActivityType   = r.IsDBNull(r.GetOrdinal("IdActivityType"))  ? null : r.GetInt32(r.GetOrdinal("IdActivityType")),
                IdLocation       = r.IsDBNull(r.GetOrdinal("IdLocation"))      ? null : r.GetInt32(r.GetOrdinal("IdLocation")),
                IdPriority       = r.IsDBNull(r.GetOrdinal("IdPriority"))      ? null : r.GetInt32(r.GetOrdinal("IdPriority")),
                IdTask           = r.IsDBNull(r.GetOrdinal("IdTask"))           ? null : r.GetInt32(r.GetOrdinal("IdTask")),
                IdClient         = r.IsDBNull(r.GetOrdinal("IdClient"))         ? null : r.GetInt32(r.GetOrdinal("IdClient")),
                Name             = r.IsDBNull(r.GetOrdinal("Name"))             ? string.Empty : r.GetString(r.GetOrdinal("Name")),
                StartDateTime    = r.GetDateTime(r.GetOrdinal("StartDateTime")),
                DueDateTime      = r.GetDateTime(r.GetOrdinal("DueDateTime")),
                Description      = r.IsDBNull(r.GetOrdinal("Descripction"))    ? null : r.GetString(r.GetOrdinal("Descripction")),
                State            = r.IsDBNull(r.GetOrdinal("State"))            ? null : Convert.ToString(r.GetValue(r.GetOrdinal("State"))),
                IdFrequency      = r.IsDBNull(r.GetOrdinal("IdFrequency"))      ? null : r.GetInt32(r.GetOrdinal("IdFrequency")),
                IdEmployeeCreate = r.IsDBNull(r.GetOrdinal("IdEmployeeCreate")) ? null : r.GetInt32(r.GetOrdinal("IdEmployeeCreate")),
                Status           = r.IsDBNull(r.GetOrdinal("Status"))           ? null : r.GetString(r.GetOrdinal("Status")),
                ActivityType     = r.IsDBNull(r.GetOrdinal("ActivityType"))     ? null : r.GetString(r.GetOrdinal("ActivityType")),
                Location         = r.IsDBNull(r.GetOrdinal("Location"))         ? null : r.GetString(r.GetOrdinal("Location")),
                Priority         = r.IsDBNull(r.GetOrdinal("Priority"))         ? null : r.GetString(r.GetOrdinal("Priority")),
                TaskName         = r.IsDBNull(r.GetOrdinal("Task"))             ? null : r.GetString(r.GetOrdinal("Task")),
                ClientName       = r.IsDBNull(r.GetOrdinal("Client"))           ? null : r.GetString(r.GetOrdinal("Client")),
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CREATE  (direct SQL — bypasses usp_AyE_Event email notifications)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<int> CreateAsync(CreateEventRequest request, int idEmployeeCreate)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            // 1. Insert event and get new ID
            const string insertSql = @"
                DECLARE @RepeatNum INT;
                SELECT @RepeatNum = ISNULL(MAX(RepeatNumber), 0) + 1 FROM dbo.Event;
                INSERT INTO dbo.Event
                    (RepeatNumber, IdStatusEvent, IdActivityType, IdLocation, IdPriority,
                     IdTask, IdClient, [Name], StartDateTime, DueDateTime,
                     Descripction, State, IdFrequency, IdEmployeeCreate,
                     CreationDate, ModificationDate)
                VALUES
                    (@RepeatNum, @IdStatusEvent, @IdActivityType, @IdLocation, @IdPriority,
                     @IdTask, @IdClient, @Name, @StartDateTime, @DueDateTime,
                     @Descripcion, @State, @IdFrequency, @IdEmployeeCreate,
                     GETDATE(), GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int newIdEvent = 0;
            using (var cmd = new SqlCommand(insertSql, con))
            {
                cmd.Parameters.AddWithValue("@IdStatusEvent",    request.IdStatusEvent);
                cmd.Parameters.AddWithValue("@IdActivityType",   request.IdActivityType);
                cmd.Parameters.AddWithValue("@IdLocation",       request.IdLocation);
                cmd.Parameters.AddWithValue("@IdPriority",       request.IdPriority);
                cmd.Parameters.AddWithValue("@IdTask",           (object?)request.IdTask    ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdClient",         (object?)request.IdClient  ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Name",             request.Name);
                cmd.Parameters.AddWithValue("@StartDateTime",    request.StartDateTime);
                cmd.Parameters.AddWithValue("@DueDateTime",      request.DueDateTime);
                cmd.Parameters.AddWithValue("@Descripcion",      (object?)request.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@State",            request.IsActive ? "1" : "0");
                cmd.Parameters.AddWithValue("@IdFrequency",      (object?)request.IdFrequency ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdEmployeeCreate", idEmployeeCreate > 0 ? (object)idEmployeeCreate : DBNull.Value);
                var result = await cmd.ExecuteScalarAsync();
                newIdEvent = result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
            }

            if (newIdEvent <= 0) return 0;

            // 2. Insert participants (selected + creator if valid IdEmployee)
            try
            {
                var participantSnapshot = (await GetParticipantsAsync(newIdEvent)).ToList();
                var validEmployeeIds    = participantSnapshot.Select(p => p.IdEmployee).ToHashSet();

                var allParticipants = new HashSet<int>(request.ParticipantIds.Where(x => x > 0 && validEmployeeIds.Contains(x)));
                if (idEmployeeCreate > 0 && validEmployeeIds.Contains(idEmployeeCreate))
                    allParticipants.Add(idEmployeeCreate);

                foreach (var empId in allParticipants)
                {
                    await AddParticipantAsync(con, newIdEvent, empId, '1');
                }
            }
            catch { /* participant insert failure must not block event creation */ }

            return newIdEvent;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  UPDATE  (direct SQL — bypasses usp_AyE_Event email notifications)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> UpdateAsync(int idEvent, UpdateEventRequest request, int idEmployeeCreate)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            // 1. Update event
            const string updateSql = @"
                UPDATE dbo.Event SET
                    IdStatusEvent    = @IdStatusEvent,
                    IdActivityType   = @IdActivityType,
                    IdLocation       = @IdLocation,
                    IdPriority       = @IdPriority,
                    IdTask           = @IdTask,
                    IdClient         = @IdClient,
                    Name             = @Name,
                    StartDateTime    = @StartDateTime,
                    DueDateTime      = @DueDateTime,
                    Descripction     = @Descripcion,
                    State            = @State,
                    IdFrequency      = @IdFrequency,
                    IdEmployeeCreate = @IdEmployeeCreate,
                    ModificationDate = GETDATE()
                WHERE IdEvent = @IdEvent";

            using (var cmd = new SqlCommand(updateSql, con))
            {
                cmd.Parameters.AddWithValue("@IdEvent",          idEvent);
                cmd.Parameters.AddWithValue("@IdStatusEvent",    request.IdStatusEvent);
                cmd.Parameters.AddWithValue("@IdActivityType",   request.IdActivityType);
                cmd.Parameters.AddWithValue("@IdLocation",       request.IdLocation);
                cmd.Parameters.AddWithValue("@IdPriority",       request.IdPriority);
                cmd.Parameters.AddWithValue("@IdTask",           (object?)request.IdTask    ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdClient",         (object?)request.IdClient  ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Name",             request.Name);
                cmd.Parameters.AddWithValue("@StartDateTime",    request.StartDateTime);
                cmd.Parameters.AddWithValue("@DueDateTime",      request.DueDateTime);
                cmd.Parameters.AddWithValue("@Descripcion",      (object?)request.Description ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@State",            request.IsActive ? "1" : "0");
                cmd.Parameters.AddWithValue("@IdFrequency",      (object?)request.IdFrequency ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@IdEmployeeCreate", idEmployeeCreate > 0 ? (object)idEmployeeCreate : DBNull.Value);
                await cmd.ExecuteNonQueryAsync();
            }

            // 2. Sync participants (isolated — participant errors don't block the event update)
            try
            {
                var participantSnapshot = (await GetParticipantsAsync(idEvent)).ToList();
                var validEmployeeIds    = participantSnapshot.Select(p => p.IdEmployee).ToHashSet();
                var currentlyActive     = participantSnapshot.Where(p => p.IsSelected)
                                                             .Select(p => p.IdEmployee).ToHashSet();

                var newParticipants = new HashSet<int>(request.ParticipantIds.Where(x => x > 0 && validEmployeeIds.Contains(x)));
                if (idEmployeeCreate > 0 && validEmployeeIds.Contains(idEmployeeCreate))
                    newParticipants.Add(idEmployeeCreate);

                foreach (var empId in currentlyActive.Except(newParticipants))
                    await UpdateParticipantAsync(con, idEvent, empId, '0');

                foreach (var empId in newParticipants)
                {
                    if (currentlyActive.Contains(empId))
                        await UpdateParticipantAsync(con, idEvent, empId, '1');
                    else
                        await AddParticipantAsync(con, idEvent, empId, '1');
                }
            }
            catch { /* participant sync failure must not roll back the event update */ }

            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  DELETE  (soft delete via usp_AyE_Event @TIPO=3, deactivate participants)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> DeleteAsync(int idEvent)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            // Deactivate all participants
            var participants = await GetParticipantsAsync(idEvent);
            foreach (var p in participants.Where(p => p.IsSelected))
            {
                await UpdateParticipantAsync(con, idEvent, p.IdEmployee, '0');
            }

            // Soft delete event
            using var cmd = new SqlCommand(
                "UPDATE dbo.Event SET State = '0' WHERE IdEvent = @IdEvent", con);
            cmd.Parameters.AddWithValue("@IdEvent", idEvent);
            await cmd.ExecuteNonQueryAsync();

            return true;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET PARTICIPANTS  (usp_AyE_Listar_Participantes)
        //  Returns ALL employees; IsSelected=true if participant of this event
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EventParticipantDto>> GetParticipantsAsync(int idEvent)
        {
            const string sql = @"
                SELECT E.IdEmployee,
                       E.LastName + ' ' + E.FirstName AS Employees,
                       EP.State
                FROM   dbo.Employees E
                LEFT   JOIN dbo.EventPacticipants EP
                       ON  EP.IdEmployee = E.IdEmployee
                       AND EP.IdEvent    = @IdEvent
                WHERE  E.State = '1'
                ORDER  BY E.LastName, E.FirstName";

            var list = new List<EventParticipantDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdEvent", idEvent);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new EventParticipantDto
                {
                    IdEmployee = r.GetInt32(r.GetOrdinal("IdEmployee")),
                    FullName   = r.IsDBNull(r.GetOrdinal("Employees")) ? string.Empty : r.GetString(r.GetOrdinal("Employees")),
                    IsSelected = !r.IsDBNull(r.GetOrdinal("State")) && Convert.ToString(r.GetValue(r.GetOrdinal("State"))) == "1"
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET CATALOG  (usp_AyE_Listar_Tablas_Todo)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EventCatalogDto>> GetCatalogAsync(string tipo)
        {
            using var con = new SqlConnection(_connectionString);
            return await con.QueryAsync<EventCatalogDto>(
                "usp_AyE_Listar_Tablas_Todo",
                new { TIPO = tipo },
                commandType: CommandType.StoredProcedure
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET CALENDAR  (direct SQL — all active events → FullCalendar format)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<EventCalendarDto>> GetCalendarAsync(int idEmployee)
        {
            const string sql = @"
                SELECT a.IdEvent, a.Name, a.StartDateTime, a.DueDateTime, a.Descripction,
                       b.Description AS Status,
                       c.Description AS ActivityType,
                       f.Description AS Task,
                       g.Name        AS Client
                FROM   Event a
                INNER  JOIN TablaMaestra b ON b.IdTabla = a.IdStatusEvent
                INNER  JOIN TablaMaestra c ON c.IdTabla = a.IdActivityType
                LEFT   JOIN Task         f ON f.IdTask   = a.IdTask
                LEFT   JOIN Client       g ON g.IdClient = a.IdClient
                WHERE  a.State = '1'
                ORDER  BY a.StartDateTime";

            var list = new List<EventCalendarDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(sql, con);

            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                var start = r.GetDateTime(r.GetOrdinal("StartDateTime"));
                var end   = r.GetDateTime(r.GetOrdinal("DueDateTime"));
                list.Add(new EventCalendarDto
                {
                    Id           = r.GetInt32(r.GetOrdinal("IdEvent")),
                    Title        = r.IsDBNull(r.GetOrdinal("Name"))         ? "—" : r.GetString(r.GetOrdinal("Name")),
                    Start        = start.ToString("yyyy-MM-ddTHH:mm:ss"),
                    End          = end.ToString("yyyy-MM-ddTHH:mm:ss"),
                    Description  = r.IsDBNull(r.GetOrdinal("Descripction")) ? null : r.GetString(r.GetOrdinal("Descripction")),
                    ClientName   = r.IsDBNull(r.GetOrdinal("Client"))        ? null : r.GetString(r.GetOrdinal("Client")),
                    TaskName     = r.IsDBNull(r.GetOrdinal("Task"))          ? null : r.GetString(r.GetOrdinal("Task")),
                    ActivityType = r.IsDBNull(r.GetOrdinal("ActivityType"))  ? null : r.GetString(r.GetOrdinal("ActivityType")),
                    Status       = r.IsDBNull(r.GetOrdinal("Status"))        ? null : r.GetString(r.GetOrdinal("Status")),
                    Color        = "#f59e0b",
                    TextColor    = "#1a1a2e",
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  HELPERS
        // ─────────────────────────────────────────────────────────────────────
        private static async Task AddParticipantAsync(SqlConnection con, int idEvent, int idEmployee, char state)
        {
            using var cmd = new SqlCommand(
                @"IF NOT EXISTS (SELECT 1 FROM dbo.EventPacticipants WHERE IdEvent=@IdEvent AND IdEmployee=@IdEmployee)
                      INSERT INTO dbo.EventPacticipants (IdEvent, IdEmployee, State) VALUES (@IdEvent, @IdEmployee, @State)
                  ELSE
                      UPDATE dbo.EventPacticipants SET State=@State WHERE IdEvent=@IdEvent AND IdEmployee=@IdEmployee", con);
            cmd.Parameters.AddWithValue("@IdEvent",    idEvent);
            cmd.Parameters.AddWithValue("@IdEmployee", idEmployee);
            cmd.Parameters.AddWithValue("@State",      state.ToString());
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task UpdateParticipantAsync(SqlConnection con, int idEvent, int idEmployee, char state)
        {
            using var cmd = new SqlCommand(
                "UPDATE dbo.EventPacticipants SET State=@State WHERE IdEvent=@IdEvent AND IdEmployee=@IdEmployee", con);
            cmd.Parameters.AddWithValue("@State",      state.ToString());
            cmd.Parameters.AddWithValue("@IdEvent",    idEvent);
            cmd.Parameters.AddWithValue("@IdEmployee", idEmployee);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
