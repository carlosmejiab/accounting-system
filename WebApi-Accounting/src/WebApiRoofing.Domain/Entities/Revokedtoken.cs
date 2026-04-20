namespace WebApiRoofing.Domain.Entities;

public class RevokedToken
{
    public int Id { get; set; }
    public string Jti { get; set; } = string.Empty;
    public string? Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime RevokedAt { get; set; }
    public int? UserId { get; set; }
}