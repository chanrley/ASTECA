using Asteca.Api.Contracts.Clientes;
using Asteca.Api.Mapping;
using Asteca.Domain.Entities;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly AstecaDbContext _db;

    public ClientesController(AstecaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> Listar([FromQuery] string? busca)
    {
        var query = _db.Clientes.Include(c => c.OrdensServico).AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();
            query = query.Where(c =>
                c.Nome.ToLower().Contains(termo) ||
                (c.Cpf != null && c.Cpf.Contains(termo)) ||
                (c.Cnpj != null && c.Cnpj.Contains(termo)));
        }

        var clientes = await query.OrderBy(c => c.Nome).ToListAsync();
        return Ok(clientes.Select(c => c.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDetailDto>> ObterPorId(int id)
    {
        var cliente = await _db.Clientes
            .Include(c => c.OrdensServico).ThenInclude(o => o.HistoricoEventos)
            .SingleOrDefaultAsync(c => c.Id == id);
        if (cliente is null) return NotFound(new { mensagem = "Cliente não encontrado." });
        return Ok(cliente.ToDetailDto());
    }

    [HttpGet("buscar-cpf")]
    public async Task<ActionResult<ClienteDetailDto>> BuscarPorCpf([FromQuery] string cpf)
    {
        // CPF é armazenado formatado (com pontuação); normaliza dos dois lados antes de comparar.
        // Volume de clientes é pequeno o suficiente pra filtrar em memória sem custo real.
        var digitos = NormalizarDocumento(cpf);
        var candidatos = await _db.Clientes
            .Include(c => c.OrdensServico).ThenInclude(o => o.HistoricoEventos)
            .Where(c => c.Cpf != null).ToListAsync();
        var cliente = candidatos.SingleOrDefault(c => NormalizarDocumento(c.Cpf!) == digitos);

        if (cliente is null) return NotFound(new { mensagem = "Nenhum cliente com esse CPF." });
        return Ok(cliente.ToDetailDto());
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Criar(ClienteRequest request)
    {
        var cliente = new Cliente
        {
            Cpf = request.Cpf,
            Cnpj = request.Cnpj,
            Nome = request.Nome,
            DataNascimento = request.DataNascimento,
            Rg = request.Rg,
            Telefone = request.Telefone,
            Celular = request.Celular,
            Endereco = request.Endereco,
            Email = request.Email
        };
        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = cliente.Id }, cliente.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClienteDto>> Atualizar(int id, ClienteRequest request)
    {
        var cliente = await _db.Clientes.Include(c => c.OrdensServico).SingleOrDefaultAsync(c => c.Id == id);
        if (cliente is null) return NotFound(new { mensagem = "Cliente não encontrado." });

        cliente.Cpf = request.Cpf;
        cliente.Cnpj = request.Cnpj;
        cliente.Nome = request.Nome;
        cliente.DataNascimento = request.DataNascimento;
        cliente.Rg = request.Rg;
        cliente.Telefone = request.Telefone;
        cliente.Celular = request.Celular;
        cliente.Endereco = request.Endereco;
        cliente.Email = request.Email;

        await _db.SaveChangesAsync();
        return Ok(cliente.ToDto());
    }

    internal static string NormalizarDocumento(string valor) => new(valor.Where(char.IsDigit).ToArray());
}
