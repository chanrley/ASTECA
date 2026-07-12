using Asteca.Api.Contracts.Clientes;
using Asteca.Api.Contracts.Ordens;
using Asteca.Api.Contracts.Versoes;
using Asteca.Domain.Entities;

namespace Asteca.Api.Mapping;

public static class MappingExtensions
{
    /// <summary>Assume Cliente.OrdensServico carregado (Include) para calcular OsCount/TotalGasto.</summary>
    public static ClienteDto ToDto(this Cliente c) => new(
        c.Id, c.Cpf, c.Cnpj, c.Documento, c.Nome, c.DataNascimento, c.Rg, c.Telefone, c.Celular, c.Endereco, c.Email,
        c.OrdensServico.Count,
        c.OrdensServico.Sum(o => o.Valor));

    /// <summary>Assume Cliente.OrdensServico (com .HistoricoEventos e .Cliente) carregado (Include + ThenInclude).</summary>
    public static ClienteDetailDto ToDetailDto(this Cliente c) => new(
        c.Id, c.Cpf, c.Cnpj, c.Documento, c.Nome, c.DataNascimento, c.Rg, c.Telefone, c.Celular, c.Endereco, c.Email,
        c.OrdensServico.Count,
        c.OrdensServico.Sum(o => o.Valor),
        c.OrdensServico.OrderByDescending(o => o.Numero).Select(o => o.ToDto()).ToList());

    /// <summary>Assume OrdemServico.Cliente e .HistoricoEventos carregados (Include).</summary>
    public static OrdemServicoDto ToDto(this OrdemServico o)
    {
        var cliente = o.Cliente!;
        return new OrdemServicoDto(
            o.Id, o.Numero, o.Codigo, o.ClienteId, cliente.Nome, cliente.Documento,
            cliente.Telefone, cliente.Celular, cliente.Email, cliente.Endereco,
            o.Tipo.ToString(), o.Chip, o.Bateria, o.Marca, o.Modelo, o.Defeito, o.Valor, o.DataAbertura,
            o.Status.ToString(), o.Observacoes,
            o.HistoricoEventos.OrderByDescending(h => h.DataHora).Select(h => new HistoricoEventoDto(h.Evento, h.DataHora)).ToList());
    }

    public static VersaoDto ToDto(this AppVersao v) => new(v.Id, v.Versao, v.Mensagem, v.CriadoEm);
}
