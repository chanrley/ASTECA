using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Asteca.Infrastructure.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.NomeUsuario).IsRequired().HasMaxLength(50);
        builder.Property(u => u.SenhaHash).IsRequired();
        builder.Property(u => u.NomeExibicao).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Papel).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(u => u.NomeUsuario).IsUnique();
    }
}
