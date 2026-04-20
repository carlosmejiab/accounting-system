using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApiRoofing.Application.DTOs.Request;
using WebApiRoofing.Application.Interfaces.Services;

namespace WebApiRoofing.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfilesController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _profileService.GetAllAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _profileService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _profileService.CreateAsync(request, userId);

        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _profileService.UpdateAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _profileService.DeleteAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/permissions")]
    public async Task<IActionResult> AssignPermissions(int id, [FromBody] AssignPermissionsRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _profileService.AssignPermissionsAsync(id, request, userId);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("permissions-matrix")]
    public async Task<IActionResult> GetPermissionsMatrix([FromQuery] int? profileId = null)
    {
        var result = await _profileService.GetPermissionsMatrixAsync(profileId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("users/{userId}/profiles")]
    public async Task<IActionResult> AssignProfilesToUser(int userId, [FromBody] AssignProfilesToUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var assignedBy = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _profileService.AssignProfilesToUserAsync(userId, request, assignedBy);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("users/{userId}/permissions")]
    public async Task<IActionResult> GetUserPermissions(int userId)
    {
        var result = await _profileService.GetUserPermissionsAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}