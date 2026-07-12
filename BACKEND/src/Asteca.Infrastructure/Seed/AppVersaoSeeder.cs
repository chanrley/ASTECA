using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Asteca.Infrastructure.Seed;

/// <summary>
/// Changelog de versões do sistema, exibido no header do frontend.
/// Roda sempre no startup (independente do seed de dados) e insere apenas as versões ainda não gravadas.
/// </summary>
public static class AppVersaoSeeder
{
    private static readonly (string Versao, string Mensagem)[] Versoes =
    [
        ("v1.0.0", "Versão inicial do Asteca Web"),
        ("v1.1.0", "Faturamento"),
        ("v1.1.1", "Nova modal de impressão em papel A4"),
        ("v1.1.2", "Logo padrão adicionada"),
    ];

    public static async Task SeedAsync(AstecaDbContext db)
    {
        var existentes = await db.AppVersoes.Select(v => v.Versao).ToListAsync();
        var faltantes = Versoes.Where(v => !existentes.Contains(v.Versao)).ToList();
        if (faltantes.Count == 0) return;

        var agora = DateTime.UtcNow;
        foreach (var (versao, mensagem) in faltantes)
        {
            db.AppVersoes.Add(new AppVersao { Versao = versao, Mensagem = mensagem, CriadoEm = agora });
        }

        await db.SaveChangesAsync();
    }
}
