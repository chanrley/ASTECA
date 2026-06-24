using Asteca.Api.Contracts.Ordens;

namespace Asteca.Api.Contracts.Clientes;

public record ClienteDetailDto(
    int Id,
    string? Cpf,
    string? Cnpj,
    string Documento,
    string Nome,
    DateOnly? DataNascimento,
    string? Rg,
    string? Telefone,
    string? Celular,
    string? Endereco,
    string? Email,
    int OsCount,
    decimal TotalGasto,
    List<OrdemServicoDto> Ordens);

public record ClienteDto(
    int Id,
    string? Cpf,
    string? Cnpj,
    string Documento,
    string Nome,
    DateOnly? DataNascimento,
    string? Rg,
    string? Telefone,
    string? Celular,
    string? Endereco,
    string? Email,
    int OsCount,
    decimal TotalGasto);

/// <summary>Mesmo payload serve para criar (POST) e atualizar (PUT) um cliente.</summary>
public record ClienteRequest(
    string? Cpf,
    string? Cnpj,
    string Nome,
    DateOnly? DataNascimento,
    string? Rg,
    string? Telefone,
    string? Celular,
    string? Endereco,
    string? Email);
