using Asteca.Api.Auth;
using Asteca.Api.Contracts.Auth;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AstecaDbContext _db;
    private readonly JwtTokenService _tokenService;

    public AuthController(AstecaDbContext db, JwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<UsuarioInfoResponse>> Login(LoginRequest request)
    {
        var usuario = await _db.Usuarios.SingleOrDefaultAsync(u => u.NomeUsuario == request.NomeUsuario && u.Ativo);
        if (usuario is null || !PasswordHasher.Verify(request.Senha, usuario.SenhaHash))
            return Unauthorized(new { mensagem = "Usuário ou senha inválidos." });

        var token = _tokenService.GerarToken(usuario);
        Response.Cookies.Append(JwtSettings.CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.Add(_tokenService.ExpiresIn)
        });

        return Ok(new UsuarioInfoResponse(usuario.NomeExibicao, usuario.Papel.ToString()));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(JwtSettings.CookieName);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<ActionResult<UsuarioInfoResponse>> Me()
    {
        var nomeUsuario = User.Identity?.Name;
        if (string.IsNullOrEmpty(nomeUsuario)) return Unauthorized();

        var usuario = await _db.Usuarios.SingleOrDefaultAsync(u => u.NomeUsuario == nomeUsuario);
        if (usuario is null) return Unauthorized();

        return Ok(new UsuarioInfoResponse(usuario.NomeExibicao, usuario.Papel.ToString()));
    }
}
