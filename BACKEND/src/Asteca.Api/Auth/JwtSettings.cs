namespace Asteca.Api.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public const string CookieName = "asteca_token";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "asteca-api";
    public int ExpiresMinutes { get; set; } = 480;
}
