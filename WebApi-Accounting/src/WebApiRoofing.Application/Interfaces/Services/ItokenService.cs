using WebApiRoofing.Domain.Entities;

namespace WebApiRoofing.Application.Interfaces.Services;

public interface ITokenService
{
    string GenerateJwtToken(User user);
    string? GetJtiFromToken(string token);
    DateTime? GetExpirationFromToken(string token);
}