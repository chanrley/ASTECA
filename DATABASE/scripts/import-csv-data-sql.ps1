<#
.SYNOPSIS
    Importa dados dos CSV para SQLite usando comandos SQL diretos (sem EF Core).

.DESCRIPTION
    Versão simplificada que gera e executa SQL direto no banco SQLite.
    Mais rápida e não depende da compilação do projeto .NET.

.PARAMETER DbPath
    Caminho para o arquivo do banco SQLite. Padrão: INFRA/data/asteca.db

.PARAMETER CsvPath
    Caminho para os arquivos CSV. Padrão: raiz do projeto

.PARAMETER BackupFirst
    Se true, cria backup primeiro. Padrão: true

.EXAMPLE
    .\import-csv-data-sql.ps1
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$DbPath = "$PSScriptRoot\..\..\INFRA\data\asteca.db",
    
    [Parameter()]
    [string]$CsvPath = "$PSScriptRoot\..\..",
    
    [Parameter()]
    [bool]$BackupFirst = $true
)

$ErrorActionPreference = "Stop"

# ==================== CONFIGURAÇÃO ====================

$clienteCsvPath = Join-Path $CsvPath "TB_CLIENTE.csv"
$aparelhoCsvPath = Join-Path $CsvPath "TB_APARELHO.csv"

# Localiza sqlite3.exe
$sqlitePath = "sqlite3" # Assume que está no PATH

# Verifica dependências
if (-not (Test-Path $clienteCsvPath)) {
    throw "Arquivo não encontrado: $clienteCsvPath"
}
if (-not (Test-Path $aparelhoCsvPath)) {
    throw "Arquivo não encontrado: $aparelhoCsvPath"
}

try {
    $null = (& $sqlitePath -version 2>&1)
}
catch {
    throw "sqlite3.exe não encontrado no PATH. Instale o SQLite CLI."
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTAÇÃO CSV → SQLite (SQL Direto)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== INCLUDES ====================

# Reutiliza funções do script principal
. "$PSScriptRoot\import-csv-data.ps1" -CsvPath $CsvPath -BackupFirst $false -ErrorAction SilentlyContinue

# ==================== BACKUP ====================

if ($BackupFirst) {
    Write-Host "[1/5] Criando backup..." -ForegroundColor Yellow
    $backupPath = "$DbPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
    Copy-Item $DbPath $backupPath
    Write-Host "  OK Backup criado: $backupPath" -ForegroundColor Green
    Write-Host ""
}

# ==================== LIMPEZA ====================

Write-Host "[2/5] Limpando dados existentes..." -ForegroundColor Yellow

$sqlClean = @"
-- Desativa constraints temporariamente
PRAGMA foreign_keys = OFF;

-- Remove dados (cascata manual)
DELETE FROM HistoricoEventos;
DELETE FROM OrdensServico;
DELETE FROM Clientes;
DELETE FROM Usuarios WHERE NomeUsuario != 'admin'; -- Preserva admin

-- Reseta sequences
DELETE FROM sqlite_sequence WHERE name IN ('Clientes', 'OrdensServico', 'HistoricoEventos');

-- Reativa constraints
PRAGMA foreign_keys = ON;
"@

$sqlClean | & $sqlitePath $DbPath
Write-Host "  OK Dados limpos!" -ForegroundColor Green
Write-Host ""

# ==================== PROCESSA CSV ====================

Write-Host "[3/5] Processando CSV..." -ForegroundColor Yellow

# Lê e processa clientes
$clientesRaw = Import-Csv -Path $clienteCsvPath -Delimiter ';' -Encoding UTF8
$clientesProcessados = @{}

foreach ($row in $clientesRaw) {
    if ([string]::IsNullOrWhiteSpace($row.COD_CLI)) { continue }
    if ($clientesProcessados.ContainsKey($row.COD_CLI)) { continue }
    
    $cpf = Sanitize-Cpf $row.CPF
    $cnpj = Sanitize-Cnpj $row.CNPJ
    if ($null -eq $cpf -and $null -eq $cnpj) { continue }
    
    $nome = Sanitize-String $row.NOME 200
    if ([string]::IsNullOrWhiteSpace($nome)) { continue }
    
    $clientesProcessados[$row.COD_CLI] = @{
        CodCli = $row.COD_CLI
        Cpf = $cpf
        Cnpj = $cnpj
        Nome = $nome
        DataNascimento = Convert-CsvDate $row.DATA_NASCIMENTO
        Rg = Sanitize-String $row.RG 20
        Telefone = Sanitize-String $row.TELEFONE 20
        Celular = Sanitize-String $row.CELULAR 20
        Endereco = Sanitize-String $row."ENDEREÇO" 300
        Email = Sanitize-String $row.EMAIL 200
    }
}

Write-Host "  > Clientes processados: $($clientesProcessados.Count)" -ForegroundColor Gray

# Lê e processa ordens
$aparelhosRaw = Import-Csv -Path $aparelhoCsvPath -Delimiter ';' -Encoding UTF8
$ordensProcessadas = @()

foreach ($row in $aparelhosRaw) {
    if ([string]::IsNullOrWhiteSpace($row.OS)) { continue }
    
    $codCli = $row.COD_CLI
    $cliente = $null
    
    if (-not [string]::IsNullOrWhiteSpace($codCli) -and $clientesProcessados.ContainsKey($codCli)) {
        $cliente = $clientesProcessados[$codCli]
    }
    else {
        $cpf = Sanitize-Cpf $row.CPF
        if ($null -ne $cpf) {
            $cliente = $clientesProcessados.Values | Where-Object { $_.Cpf -eq $cpf } | Select-Object -First 1
        }
    }
    
    if ($null -eq $cliente) { continue }
    
    $marca = Sanitize-String $row.MARCA 100
    if ([string]::IsNullOrWhiteSpace($marca)) { continue }
    
    $dataAbertura = Convert-CsvDate $row.DATA
    if ($null -eq $dataAbertura) { continue }
    
    $tipo = if ($row.OPERACAO -eq "VENDA") { "Venda" } else { "Assistencia" }
    
    $ordensProcessadas += @{
        Numero = [int]$row.OS
        ClienteCodCli = $cliente.CodCli
        Tipo = $tipo
        Marca = $marca
        Modelo = Sanitize-String $row.MODELO 150
        Defeito = Sanitize-String $row.DEFEITO 500
        Bateria = if(Convert-CsvBool $row.BATERIA) { 1 } else { 0 }
        Chip = if(Convert-CsvBool $row.CHIP) { 1 } else { 0 }
        Valor = Convert-CsvValor $row.VALOR
        DataAbertura = $dataAbertura
        Observacoes = Sanitize-String $row.OBSERVACOES 1000
    }
}

Write-Host "  > Ordens processadas: $($ordensProcessadas.Count)" -ForegroundColor Gray
Write-Host "  OK CSV processados!" -ForegroundColor Green
Write-Host ""

# ==================== GERA SQL ====================

Write-Host "[4/5] Gerando SQL..." -ForegroundColor Yellow

function Escape-SqlString {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "NULL"
    }
    $escaped = $Value.Replace("'", "''")
    return "'$escaped'"
}

$sqlInserts = @()
$sqlInserts += "BEGIN TRANSACTION;"
$sqlInserts += ""
$sqlInserts += "-- ========== CLIENTES =========="

# Mapeia COD_CLI original para novo ID
$clienteIdMap = @{}
$newId = 1

foreach ($cliente in $clientesProcessados.Values | Sort-Object { [int]$_.CodCli }) {
    $cpf = if ($cliente.Cpf) { "'$($cliente.Cpf)'" } else { "NULL" }
    $cnpj = if ($cliente.Cnpj) { "'$($cliente.Cnpj)'" } else { "NULL" }
    $dataNasc = if ($cliente.DataNascimento) { "'$($cliente.DataNascimento)'" } else { "NULL" }
    
    $sql = "INSERT INTO Clientes (Id, Cpf, Cnpj, Nome, DataNascimento, Rg, Telefone, Celular, Endereco, Email) VALUES ("
    $sql += "$newId, $cpf, $cnpj, $(Escape-SqlString $cliente.Nome), $dataNasc, "
    $sql += "$(Escape-SqlString $cliente.Rg), $(Escape-SqlString $cliente.Telefone), "
    $sql += "$(Escape-SqlString $cliente.Celular), $(Escape-SqlString $cliente.Endereco), "
    $sql += "$(Escape-SqlString $cliente.Email));"
    
    $sqlInserts += $sql
    $clienteIdMap[$cliente.CodCli] = $newId
    $newId++
}

$sqlInserts += ""
$sqlInserts += "-- ========== ORDENS DE SERVIÇO =========="

$osId = 1
foreach ($ordem in $ordensProcessadas | Sort-Object Numero) {
    $clienteId = $clienteIdMap[$ordem.ClienteCodCli]
    if ($null -eq $clienteId) { continue }
    
    $codigo = if ($ordem.Tipo -eq "Venda") { "V-$($ordem.Numero)" } else { "A-$($ordem.Numero)" }
    
    $sql = "INSERT INTO OrdensServico (Id, Numero, Codigo, ClienteId, Tipo, Chip, Bateria, Marca, Modelo, Defeito, Valor, DataAbertura, Status, Observacoes) VALUES ("
    $sql += "$osId, $($ordem.Numero), '$codigo', $clienteId, '$($ordem.Tipo)', "
    $sql += "$($ordem.Chip), $($ordem.Bateria), $(Escape-SqlString $ordem.Marca), "
    $sql += "$(Escape-SqlString $ordem.Modelo), $(Escape-SqlString $ordem.Defeito), "
    $sql += "$($ordem.Valor), '$($ordem.DataAbertura)', 'Entregue', "
    $sql += "$(Escape-SqlString $ordem.Observacoes));"
    
    $sqlInserts += $sql
    
    # Cria evento de histórico inicial
    $dataHora = "$($ordem.DataAbertura)T10:00:00"
    $sqlEvent = "INSERT INTO HistoricoEventos (OrdemServicoId, Evento, DataHora) VALUES "
    $sqlEvent += "($osId, 'Ordem de serviço criada (importação de dados legados)', '$dataHora');"
    $sqlInserts += $sqlEvent
    
    $osId++
}

$sqlInserts += ""
$sqlInserts += "COMMIT;"

Write-Host "  OK SQL gerado! Total: $($sqlInserts.Count) comandos" -ForegroundColor Green
Write-Host ""

# ==================== EXECUTA SQL ====================

Write-Host "[5/5] Executando SQL no banco..." -ForegroundColor Yellow

$tempSqlFile = Join-Path $env:TEMP "asteca-import-$(Get-Date -Format 'yyyyMMddHHmmss').sql"
$sqlInserts | Out-File $tempSqlFile -Encoding UTF8

try {
    & $sqlitePath $DbPath < $tempSqlFile 2>&1 | ForEach-Object { Write-Verbose $_ }
    Write-Host "  OK Importacao concluida!" -ForegroundColor Green
}
catch {
    Write-Error "Falha na execução SQL: $_"
    throw
}
finally {
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Clientes importados: $($clientesProcessados.Count)" -ForegroundColor White
Write-Host "  Ordens importadas: $($ordensProcessadas.Count)" -ForegroundColor White
Write-Host ""
