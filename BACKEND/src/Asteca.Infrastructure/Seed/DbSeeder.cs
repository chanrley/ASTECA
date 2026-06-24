using System.Text.Json;
using Asteca.Domain.Entities;
using Asteca.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Asteca.Infrastructure.Seed;

/// <summary>
/// Popula o banco a partir de DATABASE/seed/seed-data.json na primeira execução.
/// Idempotente: só roda se a tabela Usuarios estiver vazia.
/// </summary>
public static class DbSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static async Task SeedAsync(AstecaDbContext db, ILogger logger, string? explicitDataPath = null)
    {
        if (await db.Usuarios.AnyAsync())
        {
            logger.LogInformation("Seed ignorado: já existem usuários no banco.");
            return;
        }

        var path = ResolveSeedDataPath(explicitDataPath);
        if (path is null)
        {
            logger.LogWarning("Arquivo seed-data.json não encontrado — banco iniciará vazio (sem usuários, login será impossível).");
            return;
        }

        logger.LogInformation("Semeando banco a partir de {Path}", path);
        var json = await File.ReadAllTextAsync(path);
        var data = JsonSerializer.Deserialize<SeedDataRoot>(json, JsonOptions)
                   ?? throw new InvalidOperationException("seed-data.json vazio ou inválido.");

        foreach (var u in data.Usuarios)
        {
            db.Usuarios.Add(new Usuario
            {
                NomeUsuario = u.NomeUsuario,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(u.Senha),
                Papel = Enum.Parse<PapelUsuario>(u.Papel),
                NomeExibicao = u.NomeExibicao,
                Ativo = true
            });
        }

        var clientesPorRef = new Dictionary<string, Cliente>();
        foreach (var c in data.Clientes)
        {
            var cliente = new Cliente
            {
                Cpf = c.Cpf,
                Cnpj = c.Cnpj,
                Nome = c.Nome,
                DataNascimento = c.DataNascimento,
                Rg = c.Rg,
                Telefone = c.Telefone,
                Celular = c.Celular,
                Endereco = c.Endereco,
                Email = c.Email
            };
            db.Clientes.Add(cliente);
            clientesPorRef[c.Ref] = cliente;
        }

        // Salva usuários + clientes primeiro para obter os Ids gerados antes de criar as OS (FK).
        await db.SaveChangesAsync();

        foreach (var o in data.OrdensServico)
        {
            if (!clientesPorRef.TryGetValue(o.ClienteRef, out var cliente))
            {
                logger.LogWarning("OS {Numero}: clienteRef '{Ref}' não encontrado no seed — ignorada.", o.Numero, o.ClienteRef);
                continue;
            }

            var ordem = new OrdemServico
            {
                Numero = o.Numero,
                Codigo = o.Codigo,
                ClienteId = cliente.Id,
                Tipo = Enum.Parse<TipoOrdemServico>(o.Tipo),
                Chip = o.Chip,
                Bateria = o.Bateria,
                Marca = o.Marca,
                Modelo = o.Modelo,
                Defeito = o.Defeito,
                Valor = o.Valor,
                DataAbertura = o.DataAbertura,
                Status = Enum.Parse<StatusOrdemServico>(o.Status),
                Observacoes = o.Observacoes
            };
            foreach (var h in o.Historico)
            {
                ordem.HistoricoEventos.Add(new HistoricoEvento
                {
                    Evento = h.Evento,
                    DataHora = h.DataHora
                });
            }
            db.OrdensServico.Add(ordem);
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seed concluído: {Usuarios} usuários, {Clientes} clientes, {Ordens} ordens de serviço.",
            data.Usuarios.Count, data.Clientes.Count, data.OrdensServico.Count);
    }

    /// <summary>
    /// Resolve o caminho de seed-data.json: (1) caminho explícito/configuração,
    /// (2) ao lado do executável (caso Docker, onde o Dockerfile copia o arquivo pra lá),
    /// (3) subindo diretórios a partir do diretório base procurando DATABASE/seed/seed-data.json
    ///     (caso dev local, rodando dentro do monorepo).
    /// </summary>
    private static string? ResolveSeedDataPath(string? explicitDataPath)
    {
        if (!string.IsNullOrWhiteSpace(explicitDataPath) && File.Exists(explicitDataPath))
            return explicitDataPath;

        var besideExe = Path.Combine(AppContext.BaseDirectory, "seed-data.json");
        if (File.Exists(besideExe))
            return besideExe;

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        for (var i = 0; i < 8 && dir is not null; i++, dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "DATABASE", "seed", "seed-data.json");
            if (File.Exists(candidate))
                return candidate;
        }

        return null;
    }
}
