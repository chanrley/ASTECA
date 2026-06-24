namespace Asteca.Api.Contracts.Ordens;

public record HistoricoEventoDto(string Evento, DateTime DataHora);

public record OrdemServicoDto(
    int Id,
    int Numero,
    string Codigo,
    int ClienteId,
    string ClienteNome,
    string ClienteDocumento,
    string? ClienteTelefone,
    string? ClienteCelular,
    string? ClienteEmail,
    string? ClienteEndereco,
    string Tipo,
    bool Chip,
    bool Bateria,
    string Marca,
    string? Modelo,
    string? Defeito,
    decimal Valor,
    DateOnly DataAbertura,
    string Status,
    string? Observacoes,
    List<HistoricoEventoDto> Historico);

public record ClienteInfoRequest(
    string? Cpf,
    string? Cnpj,
    string Nome,
    string? Telefone,
    string? Celular,
    string? Endereco,
    string? Email,
    DateOnly? DataNascimento,
    string? Rg);

public record OrdemServicoCreateRequest(
    ClienteInfoRequest Cliente,
    string Tipo,
    bool Chip,
    bool Bateria,
    string? Marca,
    string? Modelo,
    string? Defeito,
    decimal Valor,
    string? Observacoes);

public record ObservacoesUpdateRequest(string? Observacoes);
