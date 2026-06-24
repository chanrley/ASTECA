using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Asteca.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Asteca.Api.Auth;

public class JwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public string GerarToken(Usuario usuario)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.NomeUsuario),
            new Claim(ClaimTypes.Role, usuario.Papel.ToString()),
            new Claim("nomeExibicao", usuario.NomeExibicao)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpiresMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public TimeSpan ExpiresIn => TimeSpan.FromMinutes(_settings.ExpiresMinutes);
}
