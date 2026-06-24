<#
.SYNOPSIS
    Valida os dados importados no banco SQLite.

.DESCRIPTION
    Executa queries de validação para verificar a integridade dos dados
    importados dos arquivos CSV.

.PARAMETER DbPath
    Caminho para o arquivo do banco SQLite.

.EXAMPLE
    .\validate-import.ps1
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$DbPath = "$PSScriptRoot\..\..\INFRA\data\asteca.db"
)

$ErrorActionPreference = "Stop"

# Verifica se o banco existe
if (-not (Test-Path $DbPath)) {
    throw "Banco de dados não encontrado: $DbPath"
}

# Localiza sqlite3.exe
$sqlitePath = "sqlite3"
try {
    $null = (& $sqlitePath -version 2>&1)
}
catch {
    throw "sqlite3.exe não encontrado no PATH."
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VALIDACAO DE DADOS IMPORTADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== QUERIES DE VALIDAÇÃO ====================

function Invoke-SqliteQuery {
    param([string]$Query, [string]$Description)
    
    Write-Host "> $Description..." -ForegroundColor Gray -NoNewline
    $result = $Query | & $sqlitePath $DbPath
    Write-Host " $result" -ForegroundColor White
    return $result
}

Write-Host "[1/6] Contagem de Registros" -ForegroundColor Yellow
Write-Host ""

$totalClientes = Invoke-SqliteQuery "SELECT COUNT(*) FROM Clientes;" "Total de Clientes"
$totalOrdens = Invoke-SqliteQuery "SELECT COUNT(*) FROM OrdensServico;" "Total de Ordens"
$totalHistorico = Invoke-SqliteQuery "SELECT COUNT(*) FROM HistoricoEventos;" "Total de Eventos"
$totalUsuarios = Invoke-SqliteQuery "SELECT COUNT(*) FROM Usuarios;" "Total de Usuários"

Write-Host ""
Write-Host "[2/6] Integridade Referencial" -ForegroundColor Yellow
Write-Host ""

$ordensOrfas = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico 
WHERE ClienteId NOT IN (SELECT Id FROM Clientes);
"@ "Ordens sem cliente (deve ser 0)"

$eventosOrfaos = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM HistoricoEventos 
WHERE OrdemServicoId NOT IN (SELECT Id FROM OrdensServico);
"@ "Eventos sem ordem (deve ser 0)"

Write-Host ""
Write-Host "[3/6] Validação de Dados Obrigatórios" -ForegroundColor Yellow
Write-Host ""

$clientesSemNome = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM Clientes WHERE Nome IS NULL OR Nome = '';
"@ "Clientes sem nome (deve ser 0)"

$clientesSemDocumento = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM Clientes WHERE (Cpf IS NULL OR Cpf = '') AND (Cnpj IS NULL OR Cnpj = '');
"@ "Clientes sem CPF/CNPJ (deve ser 0)"

$ordensSemMarca = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico WHERE Marca IS NULL OR Marca = '';
"@ "Ordens sem marca (deve ser 0)"

Write-Host ""
Write-Host "[4/6] Validação de Constraints Únicas" -ForegroundColor Yellow
Write-Host ""

$cpfsDuplicados = Invoke-SqliteQuery @"
SELECT COUNT(*) - COUNT(DISTINCT Cpf) FROM Clientes WHERE Cpf IS NOT NULL;
"@ "CPFs duplicados (deve ser 0)"

$cnpjsDuplicados = Invoke-SqliteQuery @"
SELECT COUNT(*) - COUNT(DISTINCT Cnpj) FROM Clientes WHERE Cnpj IS NOT NULL;
"@ "CNPJs duplicados (deve ser 0)"

$numerosDuplicados = Invoke-SqliteQuery @"
SELECT COUNT(*) - COUNT(DISTINCT Numero) FROM OrdensServico;
"@ "Números de OS duplicados (deve ser 0)"

$codigosDuplicados = Invoke-SqliteQuery @"
SELECT COUNT(*) - COUNT(DISTINCT Codigo) FROM OrdensServico;
"@ "Códigos de OS duplicados (deve ser 0)"

Write-Host ""
Write-Host "[5/6] Estatísticas de Dados" -ForegroundColor Yellow
Write-Host ""

$clientesPF = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM Clientes WHERE Cpf IS NOT NULL AND Cpf != '';
"@ "Clientes Pessoa Física"

$clientesPJ = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM Clientes WHERE Cnpj IS NOT NULL AND Cnpj != '';
"@ "Clientes Pessoa Jurídica"

$ordensVenda = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico WHERE Tipo = 'Venda';
"@ "Ordens tipo Venda"

$ordensAssistencia = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico WHERE Tipo = 'Assistencia';
"@ "Ordens tipo Assistência"

$ordensComBateria = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico WHERE Bateria = 1;
"@ "Ordens com bateria"

$ordensComChip = Invoke-SqliteQuery @"
SELECT COUNT(*) FROM OrdensServico WHERE Chip = 1;
"@ "Ordens com chip"

Write-Host ""
Write-Host "[6/6] Amplitude de Valores" -ForegroundColor Yellow
Write-Host ""

$valorMinimo = Invoke-SqliteQuery @"
SELECT MIN(Valor) FROM OrdensServico;
"@ "Valor mínimo"

$valorMaximo = Invoke-SqliteQuery @"
SELECT MAX(Valor) FROM OrdensServico;
"@ "Valor máximo"

$valorMedio = Invoke-SqliteQuery @"
SELECT ROUND(AVG(Valor), 2) FROM OrdensServico;
"@ "Valor médio"

$dataMinima = Invoke-SqliteQuery @"
SELECT MIN(DataAbertura) FROM OrdensServico;
"@ "Data mais antiga"

$dataMaxima = Invoke-SqliteQuery @"
SELECT MAX(DataAbertura) FROM OrdensServico;
"@ "Data mais recente"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTADO DA VALIDACAO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se há erros críticos
$erros = @()

if ([int]$ordensOrfas -gt 0) {
    $erros += "[X] Existem ordens de servico sem cliente!"
}

if ([int]$eventosOrfaos -gt 0) {
    $erros += "[X] Existem eventos sem ordem de servico!"
}

if ([int]$clientesSemNome -gt 0) {
    $erros += "[X] Existem clientes sem nome!"
}

if ([int]$clientesSemDocumento -gt 0) {
    $erros += "[X] Existem clientes sem CPF/CNPJ!"
}

if ([int]$ordensSemMarca -gt 0) {
    $erros += "[X] Existem ordens sem marca!"
}

if ([int]$cpfsDuplicados -gt 0) {
    $erros += "[X] Existem CPFs duplicados!"
}

if ([int]$cnpjsDuplicados -gt 0) {
    $erros += "[X] Existem CNPJs duplicados!"
}

if ([int]$numerosDuplicados -gt 0) {
    $erros += "[X] Existem numeros de OS duplicados!"
}

if ([int]$codigosDuplicados -gt 0) {
    $erros += "[X] Existem codigos de OS duplicados!"
}

if ($erros.Count -eq 0) {
    Write-Host "[OK] VALIDACAO PASSOU!" -ForegroundColor Green
    Write-Host "   Todos os dados foram importados corretamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "   Resumo:" -ForegroundColor White
    Write-Host "   - $totalClientes clientes ($clientesPF PF + $clientesPJ PJ)" -ForegroundColor White
    Write-Host "   - $totalOrdens ordens ($ordensVenda vendas + $ordensAssistencia assistencias)" -ForegroundColor White
    Write-Host "   - $totalHistorico eventos de historico" -ForegroundColor White
    Write-Host "   - Periodo: $dataMinima a $dataMaxima" -ForegroundColor White
    Write-Host "   - Valores: R$ $valorMinimo a R$ $valorMaximo (media: R$ $valorMedio)" -ForegroundColor White
}
else {
    Write-Host "[X] VALIDACAO FALHOU!" -ForegroundColor Red
    Write-Host ""
    foreach ($erro in $erros) {
        Write-Host "   $erro" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "   Execute novamente a importacao para corrigir os problemas." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
