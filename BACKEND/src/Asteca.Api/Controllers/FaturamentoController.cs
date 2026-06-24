using System.Globalization;
using Asteca.Api.Contracts.Faturamento;
using Asteca.Domain.Enums;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/faturamento")]
[Authorize(Roles = "Gestor")]
public class FaturamentoController : ControllerBase
{
    private const int MaxMesesNoPeriodo = 240;

    private readonly AstecaDbContext _db;

    public FaturamentoController(AstecaDbContext db)
    {
        _db = db;
    }

    /// <summary>Faturamento (OS entregues) mês a mês, somando por DataAbertura — único campo de data presente em todo o histórico, inclusive nas OS importadas do Access.</summary>
    [HttpGet("mensal")]
    public async Task<ActionResult<FaturamentoMensalResponse>> Mensal([FromQuery] string inicio, [FromQuery] string fim)
    {
        if (!TentarParsearData(inicio, out var dataInicio) || !TentarParsearData(fim, out var dataFim))
            return BadRequest(new { mensagem = "Datas inválidas. Use o formato AAAA-MM-DD." });

        if (dataFim < dataInicio)
            return BadRequest(new { mensagem = "A data final deve ser maior ou igual à data inicial." });

        var primeiroMes = new DateOnly(dataInicio.Year, dataInicio.Month, 1);
        var totalMeses = (dataFim.Year - primeiroMes.Year) * 12 + (dataFim.Month - primeiroMes.Month) + 1;
        if (totalMeses > MaxMesesNoPeriodo)
            return BadRequest(new { mensagem = "Período muito longo. Selecione um intervalo menor." });

        var entregues = await _db.OrdensServico
            .Where(o => o.Status == StatusOrdemServico.Entregue && o.DataAbertura >= dataInicio && o.DataAbertura <= dataFim)
            .Select(o => new { o.DataAbertura, o.Valor })
            .ToListAsync();

        var porMes = entregues
            .GroupBy(o => (o.DataAbertura.Year, o.DataAbertura.Month))
            .ToDictionary(g => g.Key, g => (Total: g.Sum(o => o.Valor), Quantidade: g.Count()));

        var meses = new List<FaturamentoMesDto>();
        for (var competencia = primeiroMes; competencia <= dataFim; competencia = competencia.AddMonths(1))
        {
            var (total, quantidade) = porMes.TryGetValue((competencia.Year, competencia.Month), out var valores) ? valores : (0m, 0);
            meses.Add(new FaturamentoMesDto(competencia.Year, competencia.Month, total, quantidade));
        }

        return Ok(new FaturamentoMensalResponse(meses, meses.Sum(m => m.Total), meses.Sum(m => m.Quantidade)));
    }

    private static bool TentarParsearData(string? valor, out DateOnly data) =>
        DateOnly.TryParseExact(valor, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out data);
}
