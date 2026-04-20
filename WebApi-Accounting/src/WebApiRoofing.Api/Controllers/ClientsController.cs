using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }

    // ═══════════════════════════════════════════════════
    //  GET /api/clients - Obtener todos los clientes
    // ═══════════════════════════════════════════════════
    /// <summary>
    /// Obtiene la lista de todos los clientes
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _clientService.GetAllAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ═══════════════════════════════════════════════════
    //  GET /api/clients/{id} - Obtener cliente por ID
    // ═══════════════════════════════════════════════════
    /// <summary>
    /// Obtiene un cliente específico por su ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _clientService.GetByIdAsync(id);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    // ═══════════════════════════════════════════════════
    //  POST /api/clients - Crear nuevo cliente
    // ═══════════════════════════════════════════════════
    /// <summary>
    /// Crea un nuevo cliente
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Obtener el ID del usuario autenticado
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Usuario no autenticado" });

        var result = await _clientService.CreateAsync(request, userId);

        if (!result.Success)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data }, result);
    }

    // ═══════════════════════════════════════════════════
    //  PUT /api/clients/{id} - Actualizar cliente
    // ═══════════════════════════════════════════════════
    /// <summary>
    /// Actualiza un cliente existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateClientRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Obtener el ID del usuario autenticado
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { message = "Usuario no autenticado" });

        var result = await _clientService.UpdateAsync(id, request, userId);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ═══════════════════════════════════════════════════
    //  DELETE /api/clients/{id} - Eliminar cliente
    // ═══════════════════════════════════════════════════
    /// <summary>
    /// Elimina (desactiva) un cliente
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _clientService.DeleteAsync(id);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    // ═══════════════════════════════════════════════════
    //  CATÁLOGOS (DROPDOWNS)
    // ═══════════════════════════════════════════════════

    /// <summary>
    /// Obtiene el catálogo de ubicaciones (Locations)
    /// </summary>
    [HttpGet("locations")]
    public async Task<IActionResult> GetLocations()
    {
        var result = await _clientService.GetLocationsAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Obtiene el catálogo de estados (States)
    /// </summary>
    [HttpGet("states")]
    public async Task<IActionResult> GetStates()
    {
        var result = await _clientService.GetStatesAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Obtiene las ciudades filtradas por estado
    /// </summary>
    [HttpGet("cities/{stateId}")]
    public async Task<IActionResult> GetCitiesByState(int stateId)
    {
        var result = await _clientService.GetCitiesByStateAsync(stateId);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Obtiene el catálogo de tipos de cliente
    /// </summary>
    [HttpGet("types")]
    public async Task<IActionResult> GetTypeClients()
    {
        var result = await _clientService.GetTypeClientsAsync();

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Obtiene los servicios filtrados por tipo de cliente
    /// </summary>
    [HttpGet("services/{typeClientId}")]
    public async Task<IActionResult> GetServicesByTypeClient(int typeClientId)
    {
        var result = await _clientService.GetServicesByTypeClientAsync(typeClientId);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}