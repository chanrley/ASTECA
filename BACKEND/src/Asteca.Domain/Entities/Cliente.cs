namespace Asteca.Domain.Entities;

public class Cliente
{
    public int Id { get; set; }

    /// <summary>Pessoa física. Exatamente um de Cpf/Cnpj deve estar preenchido (validado na API).</summary>
    public string? Cpf { get; set; }

    /// <summary>Pessoa jurídica.</summary>
    public string? Cnpj { get; set; }

    public string Nome { get; set; } = string.Empty;
    public DateOnly? DataNascimento { get; set; }
    public string? Rg { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }

    public ICollection<OrdemServico> OrdensServico { get; set; } = new List<OrdemServico>();

    /// <summary>Documento de identificação para exibição (CNPJ se PJ, senão CPF).</summary>
    public string Documento => !string.IsNullOrWhiteSpace(Cnpj) ? Cnpj : (Cpf ?? string.Empty);
}
