namespace Asteca.Infrastructure.Seed;

internal class SeedDataRoot
{
    public List<SeedUsuario> Usuarios { get; set; } = new();
    public List<SeedCliente> Clientes { get; set; } = new();
    public List<SeedOrdemServico> OrdensServico { get; set; } = new();
}

internal class SeedUsuario
{
    public string NomeUsuario { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string Papel { get; set; } = string.Empty;
    public string NomeExibicao { get; set; } = string.Empty;
}

internal class SeedCliente
{
    public string Ref { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Cnpj { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateOnly? DataNascimento { get; set; }
    public string? Rg { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }
}

internal class SeedOrdemServico
{
    public int Numero { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string ClienteRef { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool Chip { get; set; }
    public bool Bateria { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string? Modelo { get; set; }
    public string? Defeito { get; set; }
    public decimal Valor { get; set; }
    public DateOnly DataAbertura { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Observacoes { get; set; }
    public List<SeedHistoricoEvento> Historico { get; set; } = new();
}

internal class SeedHistoricoEvento
{
    public string Evento { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
}
