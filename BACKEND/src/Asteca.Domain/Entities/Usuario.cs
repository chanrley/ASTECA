using Asteca.Domain.Enums;

namespace Asteca.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }

    public string NomeUsuario { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public PapelUsuario Papel { get; set; }
    public string NomeExibicao { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;
}
