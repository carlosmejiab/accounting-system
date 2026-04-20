using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApiRoofing.Application.DTOs.Employees;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _svc;

        public EmployeesController(IEmployeeService svc)
        {
            _svc = svc;
        }

        /// <summary>Get all active employees</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var r = await _svc.GetAllAsync();
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get employee by ID</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _svc.GetByIdAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Create a new employee</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var r = await _svc.CreateAsync(request);
            return r.Success
                ? CreatedAtAction(nameof(GetById), new { id = r.Data }, r)
                : StatusCode(r.StatusCode, r);
        }

        /// <summary>Update an existing employee</summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var r = await _svc.UpdateAsync(id, request);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Soft-delete an employee (State = '0')</summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var r = await _svc.DeleteAsync(id);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }

        /// <summary>Get catalog — tipo: 'Location' | 'PositionEmployee'</summary>
        [HttpGet("catalogs/{tipo}")]
        public async Task<IActionResult> GetCatalog(string tipo)
        {
            var r = await _svc.GetCatalogAsync(tipo);
            return r.Success ? Ok(r) : StatusCode(r.StatusCode, r);
        }
    }
}
