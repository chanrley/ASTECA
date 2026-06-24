using Asteca.Domain.Enums;
using Asteca.Domain.Exceptions;

namespace Asteca.Domain.Entities;

public class OrdemServico
{
    public int Id { get; set; }

    /// <summary>Número sequencial visível ao usuário (ex.: 106).</summary>
    public int Numero { get; set; }

    /// <summary>Código com prefixo por tipo, ex.: "A-106" (Assistência) / "V-095" (Venda).</summary>
    public string Codigo { get; set; } = string.Empty;

    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public TipoOrdemServico Tipo { get; set; }
    public bool Chip { get; set; }
    public bool Bateria { get; set; }

    public string Marca { get; set; } = string.Empty;
    public string? Modelo { get; set; }
    public string? Defeito { get; set; }

    public decimal Valor { get; set; }

    /// <summary>Apenas a data de abertura (sem hora) — é como o negócio sempre trata esse campo.</summary>
    public DateOnly DataAbertura { get; set; } = DateOnly.FromDateTime(DateTime.Now);

    public StatusOrdemServico Status { get; set; } = StatusOrdemServico.Aberta;
    public string? Observacoes { get; set; }

    public ICollection<HistoricoEvento> HistoricoEventos { get; set; } = new List<HistoricoEvento>();

    /// <summary>
    /// "Agora", sem metadado de timezone — loja opera em um único fuso, então cada timestamp
    /// é tratado como hora de parede local (igual ao protótipo), nunca convertido para UTC/exibição.
    /// SQLite também não preserva DateTimeKind, então forçar Unspecified aqui mantém o valor
    /// idêntico entre a resposta imediata após escrever e qualquer leitura futura do banco.
    /// </summary>
    public static DateTime Agora() => DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);

    private void RegistrarEvento(string evento)
    {
        HistoricoEventos.Add(new HistoricoEvento { Evento = evento, DataHora = Agora() });
    }

    /// <summary>
    /// Avança a OS para o próximo status da progressão linear Aberta -> EmAndamento -> Pronto -> Entregue.
    /// AguardandoPeca também avança para Pronto (é um desvio, não uma etapa extra na linha do tempo).
    /// </summary>
    public void Avancar()
    {
        Status = Status switch
        {
            StatusOrdemServico.Aberta => StatusOrdemServico.EmAndamento,
            StatusOrdemServico.EmAndamento => StatusOrdemServico.Pronto,
            StatusOrdemServico.AguardandoPeca => StatusOrdemServico.Pronto,
            StatusOrdemServico.Pronto => StatusOrdemServico.Entregue,
            _ => throw new DomainException($"Não é possível avançar a partir do status '{Status}'.")
        };
        RegistrarEvento($"Status alterado para {Status}");
    }

    /// <summary>Marca a OS como aguardando peça — só a partir de Aberta ou EmAndamento.</summary>
    public void MarcarAguardandoPeca()
    {
        if (Status != StatusOrdemServico.Aberta && Status != StatusOrdemServico.EmAndamento)
            throw new DomainException($"Não é possível marcar 'Aguardando peça' a partir do status '{Status}'.");

        Status = StatusOrdemServico.AguardandoPeca;
        RegistrarEvento("Status alterado para Aguardando peça");
    }

    public void Cancelar()
    {
        if (Status == StatusOrdemServico.Entregue)
            throw new DomainException("Uma OS já entregue não pode ser cancelada.");
        if (Status == StatusOrdemServico.Cancelada)
            throw new DomainException("Esta OS já está cancelada.");

        Status = StatusOrdemServico.Cancelada;
        RegistrarEvento("OS cancelada");
    }

    public void AtualizarObservacoes(string? observacoes)
    {
        Observacoes = observacoes;
    }

    public static string GerarCodigo(TipoOrdemServico tipo, int numero)
        => (tipo == TipoOrdemServico.Venda ? "V-" : "A-") + numero.ToString("000");
}
