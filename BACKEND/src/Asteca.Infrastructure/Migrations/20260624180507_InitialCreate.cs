using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Asteca.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Cpf = table.Column<string>(type: "TEXT", maxLength: 14, nullable: true),
                    Cnpj = table.Column<string>(type: "TEXT", maxLength: 18, nullable: true),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    DataNascimento = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    Rg = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Telefone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Celular = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Endereco = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NomeUsuario = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SenhaHash = table.Column<string>(type: "TEXT", nullable: false),
                    Papel = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    NomeExibicao = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdensServico",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Numero = table.Column<int>(type: "INTEGER", nullable: false),
                    Codigo = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    ClienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Chip = table.Column<bool>(type: "INTEGER", nullable: false),
                    Bateria = table.Column<bool>(type: "INTEGER", nullable: false),
                    Marca = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Modelo = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Defeito = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Valor = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DataAbertura = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Observacoes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdensServico", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdensServico_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HistoricoEventos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrdemServicoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Evento = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    DataHora = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoEventos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricoEventos_OrdensServico_OrdemServicoId",
                        column: x => x.OrdemServicoId,
                        principalTable: "OrdensServico",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Cnpj",
                table: "Clientes",
                column: "Cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Cpf",
                table: "Clientes",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoEventos_OrdemServicoId",
                table: "HistoricoEventos",
                column: "OrdemServicoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdensServico_ClienteId",
                table: "OrdensServico",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdensServico_Codigo",
                table: "OrdensServico",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdensServico_Numero",
                table: "OrdensServico",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_NomeUsuario",
                table: "Usuarios",
                column: "NomeUsuario",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricoEventos");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "OrdensServico");

            migrationBuilder.DropTable(
                name: "Clientes");
        }
    }
}
