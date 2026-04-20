using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApiRoofing.Application.DTOs.Tasks;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly ITrackingService _svc;
        private readonly IConfiguration   _cfg;

        public TrackingController(ITrackingService svc, IConfiguration cfg)
        {
            _svc = svc;
            _cfg = cfg;
        }

        // GET api/tracking/task/{idTask}
        [HttpGet("task/{idTask:int}")]
        public async Task<IActionResult> GetByTask(int idTask)
        {
            var r = await _svc.GetByTaskAsync(idTask);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET api/tracking/task/{idTask}/debug  ← TEMPORARY DIAGNOSTIC ENDPOINT
        [HttpGet("task/{idTask:int}/debug")]
        public async Task<IActionResult> DebugByTask(int idTask)
        {
            var cs  = _cfg.GetConnectionString("DefaultConnection")!;
            var rows = new List<object>();
            using var con = new SqlConnection(cs);
            await con.OpenAsync();
            using var cmd = new SqlCommand(
                "SELECT IdTracking, IdTask, Name, State, CreationDate FROM Tracking WHERE IdTask = @IdTask ORDER BY IdTracking DESC",
                con);
            cmd.Parameters.AddWithValue("@IdTask", idTask);
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                rows.Add(new {
                    idTracking   = r.GetInt32(0),
                    idTask       = r.GetInt32(1),
                    name         = r.IsDBNull(2) ? null : r.GetString(2),
                    state        = r.IsDBNull(3) ? null : r.GetString(3),
                    creationDate = r.GetDateTime(4),
                });
            }
            return Ok(new { total = rows.Count, rows });
        }

        // POST api/tracking
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTrackingRequest req)
        {
            var r = await _svc.CreateAsync(req);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // PUT api/tracking/{id}/play
        [HttpPut("{id:int}/play")]
        public async Task<IActionResult> Play(int id)
        {
            var r = await _svc.PlayAsync(id);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // PUT api/tracking/{id}/pause
        [HttpPut("{id:int}/pause")]
        public async Task<IActionResult> Pause(int id, [FromBody] TrackingTimerRequest req)
        {
            var r = await _svc.PauseAsync(id, req.SecondsWorked);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // PUT api/tracking/{id}/stop
        [HttpPut("{id:int}/stop")]
        public async Task<IActionResult> Stop(int id, [FromBody] TrackingTimerRequest req)
        {
            var r = await _svc.StopAsync(id, req.SecondsWorked);
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET api/tracking/statuses
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var r = await _svc.GetStatusesAsync();
            return r.Success ? Ok(r) : BadRequest(r);
        }

        // GET api/tracking/employees
        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var r = await _svc.GetEmployeesAsync();
            return r.Success ? Ok(r) : BadRequest(r);
        }
    }
}
