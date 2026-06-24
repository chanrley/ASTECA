using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Asteca.Infrastructure.Configurations;

public class HistoricoEventoConfiguration : IEntityTypeConfiguration<HistoricoEvento>
{
    public void Configure(EntityTypeBuilder<HistoricoEvento> builder)
    {
        builder.ToTable("HistoricoEventos");
        builder.HasKey(h => h.Id);

        builder.Property(h => h.Evento).IsRequired().HasMaxLength(300);

        builder.HasIndex(h => h.OrdemServicoId);
    }
}
