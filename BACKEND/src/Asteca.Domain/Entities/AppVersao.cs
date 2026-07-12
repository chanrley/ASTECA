namespace Asteca.Domain.Entities;

public class AppVersao
{
    public int Id { get; set; }
    public string Versao { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
}
