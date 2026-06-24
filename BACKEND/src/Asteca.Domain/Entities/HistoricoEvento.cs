namespace Asteca.Domain.Entities;

public class HistoricoEvento
{
    public int Id { get; set; }

    public int OrdemServicoId { get; set; }
    public OrdemServico? OrdemServico { get; set; }

    public string Evento { get; set; } = string.Empty;
    public DateTime DataHora { get; set; } = OrdemServico.Agora();
}
