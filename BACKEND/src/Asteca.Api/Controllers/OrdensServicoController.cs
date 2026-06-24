using Asteca.Api.Contracts.Ordens;
using Asteca.Api.Mapping;
using Asteca.Domain.Entities;
using Asteca.Domain.Enums;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/ordens")]
[Authorize]
public class OrdensServicoController : ControllerBase
{
    private readonly AstecaDbContext _db;

    public OrdensServicoController(AstecaDbContext db)
    {
        _db = db;
    }

    private IQueryable<OrdemServico> QueryBase() => _db.OrdensServico.Include(o => o.Cliente).Include(o => o.HistoricoEventos);

    [HttpGet]
    public async Task<ActionResult<List<OrdemServicoDto>>> Listar([FromQuery] string? busca, [FromQuery] string? status)
    {
        var query = QueryBase();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusList = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Enum.TryParse<StatusOrdemServico>(s, out var st) ? st : (StatusOrdemServico?)null)
                .Where(s => s.HasValue).Select(s => s!.Value).ToList();
            if (statusList.Count > 0) query = query.Where(o => statusList.Contains(o.Status));
        }

        var ordens = await query.OrderByDescending(o => o.Numero).ToListAsync();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();
            ordens = ordens.Where(o =>
                o.Numero.ToString().Contains(termo) ||
                (o.Marca + " " + o.Modelo).ToLower().Contains(termo) ||
                (o.Defeito ?? "").ToLower().Contains(termo) ||
                o.Cliente!.Nome.ToLower().Contains(termo)).ToList();
        }

        return Ok(ordens.Select(o => o.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrdemServicoDto>> ObterPorId(int id)
    {
        var ordem = await QueryBase().SingleOrDefaultAsync(o => o.Id == id);
        if (ordem is null) return NotFound(new { mensagem = "Ordem de serviço não encontrada." });
        return Ok(ordem.ToDto());
    }

    [HttpGet("numero/{numero:int}")]
    public async Task<ActionResult<OrdemServicoDto>> ObterPorNumero(int numero)
    {
        var ordem = await QueryBase().SingleOrDefaultAsync(o => o.Numero == numero);
        if (ordem is null) return NotFound(new { mensagem = "OS não encontrada." });
        return Ok(ordem.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<OrdemServicoDto>> Criar(OrdemServicoCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Cliente.Nome))
            return BadRequest(new { mensagem = "Informe o nome do cliente." });
        if (string.IsNullOrWhiteSpace(request.Marca) && string.IsNullOrWhiteSpace(request.Defeito))
            return BadRequest(new { mensagem = "Informe aparelho (marca) ou defeito/item." });
        if (!Enum.TryParse<TipoOrdemServico>(request.Tipo, out var tipo))
            return BadRequest(new { mensagem = "Tipo de OS inválido." });

        var cliente = await EncontrarOuCriarClienteAsync(request.Cliente);

        var ultimoNumero = await _db.OrdensServico.MaxAsync(o => (int?)o.Numero) ?? 0;
        var numero = ultimoNumero + 1;

        var ordem = new OrdemServico
        {
            Numero = numero,
            Codigo = OrdemServico.GerarCodigo(tipo, numero),
            ClienteId = cliente.Id,
            Tipo = tipo,
            Chip = request.Chip,
            Bateria = request.Bateria,
            Marca = string.IsNullOrWhiteSpace(request.Marca) ? "—" : request.Marca,
            Modelo = request.Modelo,
            Defeito = string.IsNullOrWhiteSpace(request.Defeito) ? (tipo == TipoOrdemServico.Venda ? "Venda" : "Diagnóstico") : request.Defeito,
            Valor = request.Valor,
            DataAbertura = DateOnly.FromDateTime(DateTime.Now),
            Status = StatusOrdemServico.Aberta,
            Observacoes = request.Observacoes
        };
        ordem.HistoricoEventos.Add(new HistoricoEvento { Evento = "OS aberta", DataHora = OrdemServico.Agora() });

        _db.OrdensServico.Add(ordem);
        await _db.SaveChangesAsync();

        ordem.Cliente = cliente;
        return CreatedAtAction(nameof(ObterPorId), new { id = ordem.Id }, ordem.ToDto());
    }

    [HttpPatch("{id:int}/avancar")]
    public Task<ActionResult<OrdemServicoDto>> Avancar(int id) => AplicarTransicao(id, o => o.Avancar());

    [HttpPatch("{id:int}/aguardar-peca")]
    public Task<ActionResult<OrdemServicoDto>> AguardarPeca(int id) => AplicarTransicao(id, o => o.MarcarAguardandoPeca());

    [HttpPatch("{id:int}/cancelar")]
    public Task<ActionResult<OrdemServicoDto>> Cancelar(int id) => AplicarTransicao(id, o => o.Cancelar());

    [HttpPatch("{id:int}/observacoes")]
    public async Task<ActionResult<OrdemServicoDto>> AtualizarObservacoes(int id, ObservacoesUpdateRequest request)
    {
        var ordem = await QueryBase().SingleOrDefaultAsync(o => o.Id == id);
        if (ordem is null) return NotFound(new { mensagem = "Ordem de serviço não encontrada." });

        ordem.AtualizarObservacoes(request.Observacoes);
        await _db.SaveChangesAsync();
        return Ok(ordem.ToDto());
    }

    private async Task<ActionResult<OrdemServicoDto>> AplicarTransicao(int id, Action<OrdemServico> transicao)
    {
        var ordem = await QueryBase().SingleOrDefaultAsync(o => o.Id == id);
        if (ordem is null) return NotFound(new { mensagem = "Ordem de serviço não encontrada." });

        transicao(ordem);
        await _db.SaveChangesAsync();
        return Ok(ordem.ToDto());
    }

    private async Task<Cliente> EncontrarOuCriarClienteAsync(ClienteInfoRequest info)
    {
        if (!string.IsNullOrWhiteSpace(info.Cpf))
        {
            var digitos = ClientesController.NormalizarDocumento(info.Cpf);
            var existentes = await _db.Clientes.Where(c => c.Cpf != null).ToListAsync();
            var existente = existentes.SingleOrDefault(c => ClientesController.NormalizarDocumento(c.Cpf!) == digitos);
            if (existente is not null) return existente;
        }
        else if (!string.IsNullOrWhiteSpace(info.Cnpj))
        {
            var digitos = ClientesController.NormalizarDocumento(info.Cnpj);
            var existentes = await _db.Clientes.Where(c => c.Cnpj != null).ToListAsync();
            var existente = existentes.SingleOrDefault(c => ClientesController.NormalizarDocumento(c.Cnpj!) == digitos);
            if (existente is not null) return existente;
        }

        var novo = new Cliente
        {
            Cpf = info.Cpf,
            Cnpj = info.Cnpj,
            Nome = info.Nome,
            Telefone = info.Telefone,
            Celular = info.Celular,
            Endereco = info.Endereco,
            Email = info.Email,
            DataNascimento = info.DataNascimento,
            Rg = info.Rg
        };
        _db.Clientes.Add(novo);
        await _db.SaveChangesAsync();
        return novo;
    }
}
