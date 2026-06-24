using Asteca.Api.Contracts.Dashboard;
using Asteca.Api.Mapping;
using Asteca.Domain.Enums;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Gestor")]
public class DashboardController : ControllerBase
{
    private static readonly StatusOrdemServico[] StatusEmAberto =
    {
        StatusOrdemServico.Aberta, StatusOrdemServico.EmAndamento, StatusOrdemServico.AguardandoPeca
    };

    private readonly AstecaDbContext _db;

    public DashboardController(AstecaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Obter()
    {
        var ordens = await _db.OrdensServico.Include(o => o.Cliente).Include(o => o.HistoricoEventos).ToListAsync();
        var totalClientes = await _db.Clientes.CountAsync();

        var osEmAberto = ordens.Count(o => StatusEmAberto.Contains(o.Status));
        var prontas = ordens.Where(o => o.Status == StatusOrdemServico.Pronto).ToList();
        var faturamentoTotal = ordens.Where(o => o.Status == StatusOrdemServico.Entregue).Sum(o => o.Valor);
        var ordensRecentes = ordens.OrderByDescending(o => o.Numero).Take(5).Select(o => o.ToDto()).ToList();

        var distribuicao = Enum.GetValues<StatusOrdemServico>()
            .ToDictionary(s => s.ToString(), s => ordens.Count(o => o.Status == s));

        return Ok(new DashboardResponse(
            osEmAberto,
            prontas.Count,
            faturamentoTotal,
            totalClientes,
            ordensRecentes,
            distribuicao,
            prontas.Select(o => o.ToDto()).ToList()));
    }
}
