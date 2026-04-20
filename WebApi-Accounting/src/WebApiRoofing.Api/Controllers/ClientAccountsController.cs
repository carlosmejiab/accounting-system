using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.ClientAccount;
using WebApiRoofing.Application.Interfaces.Services;
using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientAccountsController : ControllerBase
    {
        private readonly IClientAccountService _clientAccountService;

        public ClientAccountsController(IClientAccountService clientAccountService)
        {
            _clientAccountService = clientAccountService;
        }

        /// <summary>
        /// Get banks catalog
        /// </summary>
        [HttpGet("banks")]
        public async Task<IActionResult> GetBanks()
        {
            var result = await _clientAccountService.GetBanksAsync();
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Get all client accounts
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _clientAccountService.GetAllAsync();
            return result.Success
                ? Ok(result)
                : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Get client account by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _clientAccountService.GetByIdAsync(id);
            return result.Success
                ? Ok(result)
                : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Get client accounts by client ID
        /// </summary>
        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetByClient(int clientId)
        {
            var result = await _clientAccountService.GetByClientAsync(clientId);
            return result.Success
                ? Ok(result)
                : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Create a new client account
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClientAccountRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var result = await _clientAccountService.CreateAsync(request, userId);

            return result.Success
                ? CreatedAtAction(nameof(GetById), new { id = result.Data }, result)
                : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Update an existing client account
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientAccountRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetUserId();
            var result = await _clientAccountService.UpdateAsync(id, request, userId);

            return result.Success
                ? Ok(result)
                : StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Delete a client account (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _clientAccountService.DeleteAsync(id);
            return result.Success
                ? Ok(result)
                : StatusCode(result.StatusCode, result);
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }
    }
}
