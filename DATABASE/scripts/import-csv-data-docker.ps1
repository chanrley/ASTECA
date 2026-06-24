<#
.SYNOPSIS
    Importa dados CSV para SQLite via Docker (sem instalar nada no host).

.DESCRIPTION
    Script que usa o container Docker do backend para importar os dados dos CSV.
    Não requer instalação de SQLite ou outras dependências no host.

.PARAMETER CsvPath
    Caminho para os arquivos CSV. Padrão: raiz do projeto

.PARAMETER BackupFirst
    Se true, cria backup. Padrão: true

.EXAMPLE
    .\import-csv-data-docker.ps1 -Verbose
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$CsvPath = "$PSScriptRoot\..\..",
    
    [Parameter()]
    [bool]$BackupFirst = $true,

    [Parameter()]
    [string]$VolumeName = "infra_asteca_db",

    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ==================== CONFIGURAÇÃO ====================

$projectRoot = Resolve-Path "$PSScriptRoot\..\.."
$clienteCsvPath = Join-Path $CsvPath "TB_CLIENTE.csv"
$aparelhoCsvPath = Join-Path $CsvPath "TB_APARELHO.csv"
$infraPath = Join-Path $projectRoot "INFRA"

# Verifica arquivos CSV
if (-not (Test-Path $clienteCsvPath)) {
    throw "Arquivo nao encontrado: $clienteCsvPath"
}
if (-not (Test-Path $aparelhoCsvPath)) {
    throw "Arquivo nao encontrado: $aparelhoCsvPath"
}

# Verifica Docker
try {
    $dockerVersion = docker --version
    Write-Verbose "Docker encontrado: $dockerVersion"
}
catch {
    throw "Docker nao esta instalado ou nao esta em execucao. Execute 'docker --version' para verificar."
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTACAO CSV -> SQLite via Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== FUNÇÕES DE CONVERSÃO ====================

function Convert-CsvDate {
    param([string]$DateString)
    
    if ([string]::IsNullOrWhiteSpace($DateString)) {
        return $null
    }
    
    try {
        # dd/MM/yyyy HH:mm:ss -> yyyy-MM-dd
        if ($DateString -match '^\d{2}/\d{2}/\d{4}') {
            $parsed = [DateTime]::ParseExact($DateString.Substring(0, 10), "dd/MM/yyyy", $null)
            return $parsed.ToString("yyyy-MM-dd")
        }
        
        # dd-MMM-yy -> yyyy-MM-dd
        $mesesPt = @{
            'jan' = '01'; 'fev' = '02'; 'mar' = '03'; 'abr' = '04'
            'mai' = '05'; 'jun' = '06'; 'jul' = '07'; 'ago' = '08'
            'set' = '09'; 'out' = '10'; 'nov' = '11'; 'dez' = '12'
        }
        
        if ($DateString -match '^(\d{2})-([a-z]{3})-(\d{2})$') {
            $dia = $Matches[1]
            $mes = $mesesPt[$Matches[2].ToLower()]
            $ano = "20" + $Matches[3]
            return "$ano-$mes-$dia"
        }
        
        $parsed = [DateTime]::Parse($DateString)
        return $parsed.ToString("yyyy-MM-dd")
    }
    catch {
        Write-Verbose "Falha ao converter data '$DateString': $_"
        return $null
    }
}

function Convert-CsvValor {
    param([string]$ValorString)
    
    if ([string]::IsNullOrWhiteSpace($ValorString)) {
        return 0.0
    }
    
    try {
        $valor = $ValorString -replace 'R\$\s*', '' -replace '\.', '' -replace ',', '.'
        return [decimal]::Parse($valor.Trim(), [System.Globalization.CultureInfo]::InvariantCulture)
    }
    catch {
        Write-Verbose "Falha ao converter valor '$ValorString': $_"
        return 0.0
    }
}

function Convert-CsvBool {
    param([string]$BoolString)
    
    if ([string]::IsNullOrWhiteSpace($BoolString)) {
        return $false
    }
    
    $upper = $BoolString.Trim().ToUpper()
    return ($upper -eq "VERDADEIRO" -or $upper -eq "TRUE" -or $upper -eq "1" -or $upper -eq "SIM")
}

function Sanitize-String {
    param([string]$Value, [int]$MaxLength = 0)
    
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }
    
    $sanitized = $Value.Trim()
    
    if ($MaxLength -gt 0 -and $sanitized.Length -gt $MaxLength) {
        $sanitized = $sanitized.Substring(0, $MaxLength)
    }
    
    return $sanitized
}

function Sanitize-Cpf {
    param([string]$Cpf)
    
    if ([string]::IsNullOrWhiteSpace($Cpf)) {
        return $null
    }
    
    $cleaned = $Cpf -replace '\D', ''
    
    if ($cleaned.Length -ne 11 -or $cleaned -match '^(\d)\1{10}$') {
        return $null
    }
    
    return $cleaned
}

function Sanitize-Cnpj {
    param([string]$Cnpj)
    
    if ([string]::IsNullOrWhiteSpace($Cnpj)) {
        return $null
    }
    
    $cleaned = $Cnpj -replace '\D', ''
    
    if ($cleaned.Length -ne 14) {
        return $null
    }
    
    return $cleaned
}

function Escape-SqlString {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "NULL"
    }
    $escaped = $Value.Replace("'", "''")
    return "'$escaped'"
}

# ==================== BACKUP ====================

if ($BackupFirst) {
    Write-Host "[1/6] Criando backup..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupDir = Join-Path $projectRoot "DATABASE\backups"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    # Copia do volume Docker para backup local
    Write-Host "  > Exportando banco do Docker..." -ForegroundColor Gray
    
    $containerName = "asteca-backend-import-temp"
    
    # Para container se estiver rodando
    docker stop $containerName 2>$null | Out-Null
    docker rm $containerName 2>$null | Out-Null
    
    # Cria container temporário para acessar o volume
    docker run -d --name $containerName `
        -v "${VolumeName}:/data" `
        alpine:latest tail -f /dev/null | Out-Null
    
    # Copia banco
    docker cp "${containerName}:/data/asteca.db" "$backupDir\asteca.db.backup-$timestamp.db"
    
    # Remove container temporário
    docker stop $containerName | Out-Null
    docker rm $containerName | Out-Null
    
    Write-Host "  OK Backup criado: asteca.db.backup-$timestamp.db" -ForegroundColor Green
    Write-Host ""
}

# ==================== PROCESSAMENTO CSV ====================

Write-Host "[2/6] Lendo e processando CSV..." -ForegroundColor Yellow

$clientesRaw = Import-Csv -Path $clienteCsvPath -Delimiter ';' -Encoding UTF8
$clientesProcessados = @{}
$clientesIgnorados = 0

foreach ($row in $clientesRaw) {
    $codCli = $row.COD_CLI
    
    if ([string]::IsNullOrWhiteSpace($codCli) -or $clientesProcessados.ContainsKey($codCli)) {
        $clientesIgnorados++
        continue
    }
    
    $cpf = Sanitize-Cpf $row.CPF
    $cnpj = Sanitize-Cnpj $row.CNPJ
    
    if ($null -eq $cpf -and $null -eq $cnpj) {
        $clientesIgnorados++
        continue
    }
    
    $nome = Sanitize-String $row.NOME 200
    if ([string]::IsNullOrWhiteSpace($nome)) {
        $clientesIgnorados++
        continue
    }
    
    $clientesProcessados[$codCli] = @{
        CodCli = $codCli
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

# Processa ordens
$aparelhosRaw = Import-Csv -Path $aparelhoCsvPath -Delimiter ';' -Encoding UTF8
$ordensProcessadas = @()
$ordensIgnoradas = 0

foreach ($row in $aparelhosRaw) {
    if ([string]::IsNullOrWhiteSpace($row.OS)) {
        $ordensIgnoradas++
        continue
    }
    
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
    
    if ($null -eq $cliente) {
        $ordensIgnoradas++
        continue
    }
    
    $marca = Sanitize-String $row.MARCA 100
    $dataAbertura = Convert-CsvDate $row.DATA
    
    if ([string]::IsNullOrWhiteSpace($marca) -or $null -eq $dataAbertura) {
        $ordensIgnoradas++
        continue
    }
    
    # OPERACAO vem "VENDA" em 100% das linhas do CSV legado (artefato do sistema antigo,
    # nao reflete tipo de servico) - DEFEITO mostra que sao majoritariamente consertos,
    # entao todas as ordens importadas sao classificadas como Assistencia.
    $tipo = "Assistencia"
    
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

# ==================== GERAÇÃO SQL ====================

Write-Host "[3/6] Gerando SQL..." -ForegroundColor Yellow

$sqlInserts = @()
$sqlInserts += "PRAGMA foreign_keys = OFF;"
$sqlInserts += "BEGIN TRANSACTION;"
$sqlInserts += ""
$sqlInserts += "-- Limpeza"
$sqlInserts += "DELETE FROM HistoricoEventos;"
$sqlInserts += "DELETE FROM OrdensServico;"
$sqlInserts += "DELETE FROM Clientes;"
$sqlInserts += "DELETE FROM sqlite_sequence WHERE name IN ('Clientes', 'OrdensServico', 'HistoricoEventos');"
$sqlInserts += ""
$sqlInserts += "-- Clientes"

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
$sqlInserts += "-- Ordens de Servico"

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
    
    # Histórico
    $dataHora = "$($ordem.DataAbertura)T10:00:00"
    $sqlEvent = "INSERT INTO HistoricoEventos (OrdemServicoId, Evento, DataHora) VALUES "
    $sqlEvent += "($osId, 'Ordem de servico criada (importacao de dados legados)', '$dataHora');"
    $sqlInserts += $sqlEvent
    
    $osId++
}

$sqlInserts += ""
$sqlInserts += "COMMIT;"
$sqlInserts += "PRAGMA foreign_keys = ON;"

Write-Host "  OK SQL gerado: $($sqlInserts.Count) comandos" -ForegroundColor Green
Write-Host ""

# ==================== EXECUÇÃO VIA DOCKER ====================

Write-Host "[4/6] Importando via Docker..." -ForegroundColor Yellow
Write-Host "  ATENCAO: Dados existentes serao APAGADOS!" -ForegroundColor Red
Write-Host ""

if ($Force) {
    Write-Host "  (confirmacao automatica via -Force)" -ForegroundColor Gray
}
else {
    $confirm = Read-Host "Digite 'CONFIRMO' para prosseguir"
    if ($confirm -ne 'CONFIRMO') {
        throw "Importacao cancelada"
    }
}

Write-Host ""
Write-Host "  > Preparando container..." -ForegroundColor Gray

# Cria arquivo SQL temporário
$tempDir = Join-Path $projectRoot "DATABASE\temp"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

$tempSqlFile = Join-Path $tempDir "import-$(Get-Date -Format 'yyyyMMddHHmmss').sql"
$sqlInserts | Out-File $tempSqlFile -Encoding UTF8

Write-Host "  > Executando SQL no banco..." -ForegroundColor Gray

# Para qualquer container temp anterior
$containerName = "asteca-sqlite-import"
docker stop $containerName 2>$null | Out-Null
docker rm $containerName 2>$null | Out-Null

# Executa SQL via container temporário com sqlite3
docker run --rm --name $containerName `
    -v "${VolumeName}:/data" `
    -v "${tempSqlFile}:/import.sql" `
    alpine:latest sh -c "apk add --no-cache sqlite && sqlite3 /data/asteca.db < /import.sql"

if ($LASTEXITCODE -ne 0) {
    throw "Erro ao executar SQL no Docker"
}

# Remove arquivo temporário
Remove-Item $tempSqlFile -Force

Write-Host "  OK Importacao concluida!" -ForegroundColor Green
Write-Host ""

# ==================== RESUMO ====================

Write-Host "[5/6] Resumo:" -ForegroundColor Yellow
Write-Host "  Clientes importados: $($clientesProcessados.Count)" -ForegroundColor White
Write-Host "  Ordens importadas: $($ordensProcessadas.Count)" -ForegroundColor White
Write-Host "  Clientes ignorados: $clientesIgnorados" -ForegroundColor Gray
Write-Host "  Ordens ignoradas: $ordensIgnoradas" -ForegroundColor Gray
Write-Host ""

Write-Host "[6/6] Validacao..." -ForegroundColor Yellow
Write-Host "  Execute: .\validate-import-docker.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
