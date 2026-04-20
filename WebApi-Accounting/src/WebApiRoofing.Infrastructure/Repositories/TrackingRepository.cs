using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Repositories;

namespace WebApiRoofing.Infrastructure.Repositories
{
    public class TrackingRepository : ITrackingRepository
    {
        private readonly string _connectionString;

        public TrackingRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new ArgumentNullException(nameof(configuration));
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET BY TASK
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<TrackingDto>> GetByTaskAsync(int idTask)
        {
            var list = new List<TrackingDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            const string sql = @"
                SELECT t.IdTracking,
                       t.IdTask,
                       t.Name                                           AS Tracking,
                       t.StartDateTime,
                       t.DueDateTime,
                       ISNULL(t.DurationTime, 0)                       AS DurationTime,
                       ISNULL(t.TimeWork, 0)                           AS TimeWork,
                       t.TrackingStar,
                       t.IdStatusTracking,
                       ISNULL(tm.Description, '')                      AS Status,
                       t.IdEmployee,
                       ISNULL(CONCAT(e.FirstName, ' ', e.LastName), '') AS EmployeeName,
                       ISNULL(LTRIM(RTRIM(t.State)), '1')              AS State
                FROM   Tracking t
                LEFT   JOIN TablaMaestra tm ON tm.IdTabla = t.IdStatusTracking
                                            AND tm.Groups = 'MStatusTracking'
                LEFT   JOIN Employees    e  ON e.IdEmployee = t.IdEmployee
                WHERE  t.IdTask = @IdTask
                  AND  ISNULL(LTRIM(RTRIM(t.State)), '1') != '0'
                ORDER  BY t.IdTracking DESC";
            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@IdTask", idTask);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TrackingDto
                {
                    IdTracking       = r.GetInt32(r.GetOrdinal("IdTracking")),
                    IdTask           = r.GetInt32(r.GetOrdinal("IdTask")),
                    Name             = r.IsDBNull(r.GetOrdinal("Tracking"))        ? string.Empty : r.GetString(r.GetOrdinal("Tracking")),
                    StartDateTime    = r.IsDBNull(r.GetOrdinal("StartDateTime"))   ? null : r.GetDateTime(r.GetOrdinal("StartDateTime")),
                    DueDateTime      = r.IsDBNull(r.GetOrdinal("DueDateTime"))     ? null : r.GetDateTime(r.GetOrdinal("DueDateTime")),
                    DurationTime     = r.GetInt32(r.GetOrdinal("DurationTime")),
                    TimeWork         = r.GetInt32(r.GetOrdinal("TimeWork")),
                    TrackingStar     = r.IsDBNull(r.GetOrdinal("TrackingStar"))     ? null : r.GetDateTime(r.GetOrdinal("TrackingStar")),
                    IdStatusTracking = r.IsDBNull(r.GetOrdinal("IdStatusTracking")) ? null : r.GetInt32(r.GetOrdinal("IdStatusTracking")),
                    Status           = r.IsDBNull(r.GetOrdinal("Status"))          ? string.Empty : r.GetString(r.GetOrdinal("Status")),
                    IdEmployee       = r.IsDBNull(r.GetOrdinal("IdEmployee"))      ? null : r.GetInt32(r.GetOrdinal("IdEmployee")),
                    EmployeeName     = r.IsDBNull(r.GetOrdinal("EmployeeName"))    ? string.Empty : r.GetString(r.GetOrdinal("EmployeeName")),
                    State            = r.IsDBNull(r.GetOrdinal("State"))           ? "1"  : r.GetString(r.GetOrdinal("State")).Trim(),
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  CREATE
        // ─────────────────────────────────────────────────────────────────────
        public async Task<int> CreateAsync(CreateTrackingRequest req)
        {
            var defaultDate = new DateTime(1990, 1, 1, 0, 0, 0);
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand("usp_AyE_Tracking", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@IdTracking",       0);
            cmd.Parameters.AddWithValue("@IdTask",           req.IdTask);
            cmd.Parameters.AddWithValue("@IdEmployee",       (object?)req.IdEmployee ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IdStatusTracking", (object?)req.IdStatusTracking ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Name",             req.Name);
            cmd.Parameters.AddWithValue("@StartDateTime",    (object?)req.StartDateTime ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DueDateTime",      (object?)req.DueDateTime   ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DurationTime",     0);
            cmd.Parameters.AddWithValue("@TimeWork",         0);
            cmd.Parameters.AddWithValue("@TrackingStar",      defaultDate);
            cmd.Parameters.AddWithValue("@TrackingDue",      defaultDate);
            cmd.Parameters.AddWithValue("@State",            "2");
            cmd.Parameters.AddWithValue("@TIPO",             1);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        // ─────────────────────────────────────────────────────────────────────
        //  PLAY — set status to Working (55), record start time
        // ─────────────────────────────────────────────────────────────────────
        public async Task PlayAsync(int idTracking)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                @"UPDATE Tracking
                  SET    IdStatusTracking = 55,
                         TrackingStar     = GETDATE()
                  WHERE  IdTracking = @IdTracking", con);
            cmd.Parameters.AddWithValue("@IdTracking", idTracking);
            await cmd.ExecuteNonQueryAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        //  PAUSE — set status to Paused (54), accumulate time worked
        // ─────────────────────────────────────────────────────────────────────
        public async Task PauseAsync(int idTracking, int secondsWorked)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                @"UPDATE Tracking
                  SET    IdStatusTracking = 54,
                         TimeWork         = ISNULL(TimeWork, 0) + @SecondsWorked,
                         TrackingDue      = GETDATE()
                  WHERE  IdTracking = @IdTracking", con);
            cmd.Parameters.AddWithValue("@IdTracking",    idTracking);
            cmd.Parameters.AddWithValue("@SecondsWorked", secondsWorked);
            await cmd.ExecuteNonQueryAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        //  STOP — set tracking to Completed (56), set task to In-Progress (47)
        // ─────────────────────────────────────────────────────────────────────
        public async Task StopAsync(int idTracking, int secondsWorked)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                @"UPDATE Tracking
                  SET    IdStatusTracking = 56,
                         TimeWork         = ISNULL(TimeWork, 0) + @SecondsWorked,
                         DurationTime     = ISNULL(TimeWork, 0) + @SecondsWorked,
                         TrackingDue      = GETDATE()
                  WHERE  IdTracking = @IdTracking;

                  UPDATE Task
                  SET    IdStatus = 47
                  WHERE  IdTask = (SELECT IdTask FROM Tracking WHERE IdTracking = @IdTracking);", con);
            cmd.Parameters.AddWithValue("@IdTracking",    idTracking);
            cmd.Parameters.AddWithValue("@SecondsWorked", secondsWorked);
            await cmd.ExecuteNonQueryAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET STATUSES
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<TrackingStatusDto>> GetStatusesAsync()
        {
            var list = new List<TrackingStatusDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                @"SELECT IdTabla, Description
                  FROM   TablaMaestra
                  WHERE  Groups = 'MStatusTracking'
                  ORDER  BY IdTabla", con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TrackingStatusDto
                {
                    IdTabla     = r.GetInt32(r.GetOrdinal("IdTabla")),
                    Description = r.IsDBNull(r.GetOrdinal("Description")) ? string.Empty : r.GetString(r.GetOrdinal("Description")),
                });
            }
            return list;
        }

        // ─────────────────────────────────────────────────────────────────────
        //  GET EMPLOYEES
        // ─────────────────────────────────────────────────────────────────────
        public async Task<IEnumerable<TrackingEmployeeDto>> GetEmployeesAsync()
        {
            var list = new List<TrackingEmployeeDto>();
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();
            const string sql = @"
                SELECT IdEmployee, LastName + ' ' + FirstName AS Employees
                FROM   Employees
                WHERE  State = '1'
                ORDER  BY LastName ASC";
            using var cmd = new SqlCommand(sql, con);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new TrackingEmployeeDto
                {
                    IdEmployee = r.GetInt32(r.GetOrdinal("IdEmployee")),
                    FullName   = r.IsDBNull(r.GetOrdinal("Employees")) ? string.Empty : r.GetString(r.GetOrdinal("Employees")),
                });
            }
            return list;
        }
    }
}
