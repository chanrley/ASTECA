using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Infrastructure;

public class AstecaDbContext : DbContext
{
    public AstecaDbContext(DbContextOptions<AstecaDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<OrdemServico> OrdensServico => Set<OrdemServico>();
    public DbSet<HistoricoEvento> HistoricoEventos => Set<HistoricoEvento>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<AppVersao> AppVersoes => Set<AppVersao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AstecaDbContext).Assembly);
    }
}
