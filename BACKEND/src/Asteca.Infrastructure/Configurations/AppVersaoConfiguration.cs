using Asteca.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Asteca.Infrastructure.Configurations;

public class AppVersaoConfiguration : IEntityTypeConfiguration<AppVersao>
{
    public void Configure(EntityTypeBuilder<AppVersao> builder)
    {
        builder.ToTable("AppVersoes");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Versao).IsRequired().HasMaxLength(20);
        builder.Property(v => v.Mensagem).IsRequired().HasMaxLength(500);

        builder.HasIndex(v => v.Versao).IsUnique();
    }
}
