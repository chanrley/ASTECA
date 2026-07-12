using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Asteca.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppVersoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppVersoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Versao = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Mensagem = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppVersoes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppVersoes_Versao",
                table: "AppVersoes",
                column: "Versao",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppVersoes");
        }
    }
}
