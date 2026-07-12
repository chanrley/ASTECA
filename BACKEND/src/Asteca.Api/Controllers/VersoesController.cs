using Asteca.Api.Contracts.Versoes;
using Asteca.Api.Mapping;
using Asteca.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Api.Controllers;

[ApiController]
[Route("api/versoes")]
[Authorize]
public class VersoesController : ControllerBase
{
    private readonly AstecaDbContext _db;

    public VersoesController(AstecaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<VersaoDto>>> Listar()
    {
        var versoes = await _db.AppVersoes.OrderByDescending(v => v.Id).ToListAsync();
        return Ok(versoes.Select(v => v.ToDto()).ToList());
    }
}
