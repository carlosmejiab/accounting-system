using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Events;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _svc;

        public EventsController(IEventService svc)
        {
            _svc = svc;
        }

        /// <summary>
        /// Get all events for the current user (filtered by employee ID from JWT)
        /// NOTE: JWT user.Id is used as IdEmployee. Adjust if your Users and Employees IDs differ.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var employeeId = GetUserId();
            var r = await _svc.GetAllAsync(employeeId);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get a single event by ID</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _svc.GetByIdAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Create a new event (with participants)</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var employeeId = GetEmployeeId();
            var r = await _svc.CreateAsync(request, employeeId);
            return r.Success
                ? CreatedAtAction(nameof(GetById), new { id = r.Data }, r)
                : StatusCode(r.StatusCode, r);
        }

        /// <summary>Update an existing event</summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var employeeId = GetEmployeeId();
            var r = await _svc.UpdateAsync(id, request, employeeId);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Soft-delete an event (sets State = '0')</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await _svc.DeleteAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get participants for an event (all employees with IsSelected flag)</summary>
        [HttpGet("{id}/participants")]
        public async Task<IActionResult> GetParticipants(int id)
        {
            var r = await _svc.GetParticipantsAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get a catalog by TIPO (MStatusEvent, MActivityType, MLocationes, MPriority, MRepeatEvent, MEmployees)</summary>
        [HttpGet("catalogs/{tipo}")]
        public async Task<IActionResult> GetCatalog(string tipo)
        {
            var r = await _svc.GetCatalogAsync(tipo);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get events formatted for FullCalendar (filtered by activity type, same as original)</summary>
        [HttpGet("calendar")]
        public async Task<IActionResult> GetCalendar()
        {
            var employeeId = GetUserId();
            var r = await _svc.GetCalendarAsync(employeeId);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        // Returns IdEmployee from JWT — used as participant/creator for event operations
        private int GetEmployeeId()
        {
            var claim = User.FindFirst("idEmployee")?.Value;
            return int.TryParse(claim, out var id) && id > 0 ? id : GetUserId();
        }
    }
}
