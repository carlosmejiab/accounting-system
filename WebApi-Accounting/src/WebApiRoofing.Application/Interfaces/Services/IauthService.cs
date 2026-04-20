using WebApiRoofing.Application.DTOs.Auth;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<bool> LogoutAsync(string token);
    Task<UserDto?> GetMeAsync(int userId);
}