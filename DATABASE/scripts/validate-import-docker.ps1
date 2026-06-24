<#
.SYNOPSIS
    Valida dados importados via Docker (sem instalar SQLite no host).

.EXAMPLE
    .\validate-import-docker.ps1
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$VolumeName = "infra_asteca_db"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VALIDACAO via Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Invoke-DockerSqlite {
    param([string]$Query)
    
    $containerName = "asteca-sqlite-query-temp"
    
    # Para container anterior
    docker stop $containerName 2>$null | Out-Null
    docker rm $containerName 2>$null | Out-Null
    
    # Executa query
    $result = docker run --rm --name $containerName `
        -v "${VolumeName}:/data" `
        alpine:latest sh -c "apk add --no-cache sqlite >/dev/null 2>&1 && sqlite3 /data/asteca.db `"$Query`""
    
    return $result
}

Write-Host "[1/4] Contagens..." -ForegroundColor Yellow

$totalClientes = Invoke-DockerSqlite "SELECT COUNT(*) FROM Clientes;"
Write-Host "  > Clientes: $totalClientes" -ForegroundColor White

$totalOrdens = Invoke-DockerSqlite "SELECT COUNT(*) FROM OrdensServico;"
Write-Host "  > Ordens: $totalOrdens" -ForegroundColor White

$totalHistorico = Invoke-DockerSqlite "SELECT COUNT(*) FROM HistoricoEventos;"
Write-Host "  > Eventos: $totalHistorico" -ForegroundColor White

Write-Host ""
Write-Host "[2/4] Integridade..." -ForegroundColor Yellow

$ordensOrfas = Invoke-DockerSqlite "SELECT COUNT(*) FROM OrdensServico WHERE ClienteId NOT IN (SELECT Id FROM Clientes);"
Write-Host "  > Ordens orfas (deve ser 0): $ordensOrfas" -ForegroundColor White

$eventosOrfaos = Invoke-DockerSqlite "SELECT COUNT(*) FROM HistoricoEventos WHERE OrdemServicoId NOT IN (SELECT Id FROM OrdensServico);"
Write-Host "  > Eventos orfaos (deve ser 0): $eventosOrfaos" -ForegroundColor White

Write-Host ""
Write-Host "[3/4] Dados obrigatorios..." -ForegroundColor Yellow

$clientesSemNome = Invoke-DockerSqlite "SELECT COUNT(*) FROM Clientes WHERE Nome IS NULL OR Nome = '';"
Write-Host "  > Clientes sem nome (deve ser 0): $clientesSemNome" -ForegroundColor White

$ordensSemMarca = Invoke-DockerSqlite "SELECT COUNT(*) FROM OrdensServico WHERE Marca IS NULL OR Marca = '';"
Write-Host "  > Ordens sem marca (deve ser 0): $ordensSemMarca" -ForegroundColor White

Write-Host ""
Write-Host "[4/4] Estatisticas..." -ForegroundColor Yellow

$clientesPF = Invoke-DockerSqlite "SELECT COUNT(*) FROM Clientes WHERE Cpf IS NOT NULL;"
Write-Host "  > Clientes PF: $clientesPF" -ForegroundColor White

$clientesPJ = Invoke-DockerSqlite "SELECT COUNT(*) FROM Clientes WHERE Cnpj IS NOT NULL;"
Write-Host "  > Clientes PJ: $clientesPJ" -ForegroundColor White

$ordensVenda = Invoke-DockerSqlite "SELECT COUNT(*) FROM OrdensServico WHERE Tipo = 'Venda';"
Write-Host "  > Vendas: $ordensVenda" -ForegroundColor White

$ordensAssistencia = Invoke-DockerSqlite "SELECT COUNT(*) FROM OrdensServico WHERE Tipo = 'Assistencia';"
Write-Host "  > Assistencias: $ordensAssistencia" -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Valida erros
$erros = 0
if ([int]$ordensOrfas -gt 0) { $erros++ }
if ([int]$eventosOrfaos -gt 0) { $erros++ }
if ([int]$clientesSemNome -gt 0) { $erros++ }
if ([int]$ordensSemMarca -gt 0) { $erros++ }

if ($erros -eq 0) {
    Write-Host "  [OK] VALIDACAO PASSOU!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Resumo:" -ForegroundColor White
    Write-Host "  - $totalClientes clientes ($clientesPF PF + $clientesPJ PJ)" -ForegroundColor White
    Write-Host "  - $totalOrdens ordens ($ordensVenda vendas + $ordensAssistencia assistencias)" -ForegroundColor White
}
else {
    Write-Host "  [X] VALIDACAO FALHOU com $erros erros!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
