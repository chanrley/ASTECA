using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Asteca.Infrastructure.Configurations;

public class OrdemServicoConfiguration : IEntityTypeConfiguration<OrdemServico>
{
    public void Configure(EntityTypeBuilder<OrdemServico> builder)
    {
        builder.ToTable("OrdensServico");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Codigo).IsRequired().HasMaxLength(10);
        builder.Property(o => o.Marca).IsRequired().HasMaxLength(100);
        builder.Property(o => o.Modelo).HasMaxLength(150);
        builder.Property(o => o.Defeito).HasMaxLength(500);
        builder.Property(o => o.Observacoes).HasMaxLength(1000);
        builder.Property(o => o.Valor).HasColumnType("decimal(10,2)");

        builder.Property(o => o.Tipo).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(o => o.Numero).IsUnique();
        builder.HasIndex(o => o.Codigo).IsUnique();

        builder.HasMany(o => o.HistoricoEventos)
            .WithOne(h => h.OrdemServico)
            .HasForeignKey(h => h.OrdemServicoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
