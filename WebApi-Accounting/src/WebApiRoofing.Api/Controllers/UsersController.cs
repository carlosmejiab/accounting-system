using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Users;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // ===================================
    // GET /api/Users/roles
    // Devuelve los perfiles activos de dbo.Profiles
    // para poblar el select dinámicamente en el frontend.
    // El frontend muestra Name (label) y envía Id (value).
    // DEBE ir ANTES de {id:int} para evitar conflicto de rutas.
    // ===================================
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _userService.GetRolesAsync();
        return Ok(new { data = roles });
    }

    // ===================================
    // GET /api/Users
    // ===================================
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? orderBy = "CreatedAt",
        [FromQuery] string? orderDirection = "DESC")
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search, orderBy, orderDirection);

        return Ok(new
        {
            data = new
            {
                items = result.Items,
                pagination = new
                {
                    totalItems = result.Total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)result.Total / pageSize)
                }
            }
        });
    }

    // ===================================
    // GET /api/Users/{id}
    // ===================================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);

        if (user == null)
            return NotFound(new { message = "USER_NOT_FOUND" });

        return Ok(new { data = user });
    }

    // ===================================
    // POST /api/Users
    // CreateUserRequest ahora incluye ProfileId (int)
    // El backend:
    //   1. Crea el usuario en dbo.Users con Rol = "User" por defecto
    //   2. Si ProfileId == perfil "Super Administrador" o "Administrador" → Rol = "Admin"
    //   3. Inserta en dbo.UserProfiles la relación UserId <-> ProfileId
    // ===================================
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "BAD_REQUEST" });

        try
        {
            var actorUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var created = await _userService.CreateUserAsync(request, actorUserId);
            return CreatedAtAction(nameof(GetUser), new { id = created.Id }, new
            {
                message = "Usuario creado exitosamente",
                data = created
            });
        }
        catch (InvalidOperationException ex) when (ex.Message == "USERNAME_ALREADY_EXISTS")
        {
            return Conflict(new { message = "USERNAME_ALREADY_EXISTS" });
        }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_ALREADY_EXISTS")
        {
            return Conflict(new { message = "EMAIL_ALREADY_EXISTS" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "INTERNAL_SERVER_ERROR" });
        }
    }

    // ===================================
    // PUT /api/Users/{id}
    // UpdateUserRequest también acepta ProfileId opcional
    // ===================================
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "BAD_REQUEST" });

        try
        {
            var actorUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var updated = await _userService.UpdateUserAsync(id, request, actorUserId);
            return Ok(new
            {
                message = "Usuario actualizado exitosamente",
                data = updated
            });
        }
        catch (KeyNotFoundException ex) when (ex.Message == "USER_NOT_FOUND")
        {
            return NotFound(new { message = "USER_NOT_FOUND" });
        }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_ALREADY_EXISTS")
        {
            return Conflict(new { message = "EMAIL_ALREADY_EXISTS" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "INTERNAL_SERVER_ERROR" });
        }
    }

    // ===================================
    // DELETE /api/Users/{id}
    // ===================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var actorUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var deleted = await _userService.DeleteUserAsync(id, actorUserId);

            if (!deleted)
                return NotFound(new { message = "USER_NOT_FOUND" });

            return Ok(new { message = "Usuario eliminado exitosamente" });
        }
        catch (KeyNotFoundException ex) when (ex.Message == "USER_NOT_FOUND")
        {
            return NotFound(new { message = "USER_NOT_FOUND" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "INTERNAL_SERVER_ERROR" });
        }
    }
}