using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Asteca.Infrastructure.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nome).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cpf).HasMaxLength(14);
        builder.Property(c => c.Cnpj).HasMaxLength(18);
        builder.Property(c => c.Rg).HasMaxLength(20);
        builder.Property(c => c.Telefone).HasMaxLength(20);
        builder.Property(c => c.Celular).HasMaxLength(20);
        builder.Property(c => c.Endereco).HasMaxLength(300);
        builder.Property(c => c.Email).HasMaxLength(200);

        builder.HasIndex(c => c.Cpf).IsUnique();
        builder.HasIndex(c => c.Cnpj).IsUnique();

        builder.Ignore(c => c.Documento);

        builder.HasMany(c => c.OrdensServico)
            .WithOne(o => o.Cliente)
            .HasForeignKey(o => o.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
