namespace Asteca.Api.Contracts.Auth;

public record LoginRequest(string NomeUsuario, string Senha);

public record UsuarioInfoResponse(string NomeExibicao, string Papel);
