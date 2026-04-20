using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Auth;

public class LoginRequest
{
    [Required(ErrorMessage = "El username es requerido")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El password es requerido")]
    public string Password { get; set; } = string.Empty;
}