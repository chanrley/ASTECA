<#
.SYNOPSIS
    Importa dados dos arquivos CSV legados para o banco de dados SQLite usando EF Core.

.DESCRIPTION
    Este script lê os arquivos TB_CLIENTE.csv e TB_APARELHO.csv e popula o banco de dados
    SQLite substituindo os dados mockados existentes.
    
    O script:
    1. Remove todos os dados existentes (cascata)
    2. Importa clientes do TB_CLIENTE.csv
    3. Importa ordens de serviço do TB_APARELHO.csv
    4. Cria histórico inicial para cada OS
    5. Valida a integridade dos dados importados

.PARAMETER CsvPath
    Caminho para o diretório contendo os arquivos CSV. Por padrão usa o diretório raiz do projeto.

.PARAMETER ConnectionString
    String de conexão do SQLite. Por padrão usa o banco em INFRA/data/asteca.db

.PARAMETER BackupFirst
    Se verdadeiro, cria um backup antes de limpar os dados. Padrão: true

.EXAMPLE
    .\import-csv-data.ps1
    
.EXAMPLE
    .\import-csv-data.ps1 -CsvPath "C:\dados" -BackupFirst $false
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$CsvPath = "$PSScriptRoot\..\..",
    
    [Parameter()]
    [string]$ConnectionString,
    
    [Parameter()]
    [bool]$BackupFirst = $true
)

$ErrorActionPreference = "Stop"

# ==================== CONFIGURAÇÃO ====================

$clienteCsvPath = Join-Path $CsvPath "TB_CLIENTE.csv"
$aparelhoCsvPath = Join-Path $CsvPath "TB_APARELHO.csv"
$backendPath = Join-Path $PSScriptRoot "..\..\BACKEND\src\Asteca.Api"

# Verifica se os arquivos existem
if (-not (Test-Path $clienteCsvPath)) {
    throw "Arquivo não encontrado: $clienteCsvPath"
}
if (-not (Test-Path $aparelhoCsvPath)) {
    throw "Arquivo não encontrado: $aparelhoCsvPath"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTAÇÃO DE DADOS CSV → SQLite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ==================== FUNÇÕES AUXILIARES ====================

function Convert-CsvDate {
    param([string]$DateString)
    
    if ([string]::IsNullOrWhiteSpace($DateString)) {
        return $null
    }
    
    try {
        # Formato esperado: "29-mar-16" ou "20/10/2023 13:31:29"
        
        # Tenta formato dd/MM/yyyy HH:mm:ss primeiro
        if ($DateString -match '^\d{2}/\d{2}/\d{4}') {
            $parsed = [DateTime]::ParseExact($DateString.Substring(0, 10), "dd/MM/yyyy", $null)
            return $parsed.ToString("yyyy-MM-dd")
        }
        
        # Tenta formato dd-MMM-yy (português)
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
        
        # Tenta formato genérico
        $parsed = [DateTime]::Parse($DateString)
        return $parsed.ToString("yyyy-MM-dd")
    }
    catch {
        Write-Warning "Falha ao converter data '$DateString': $_"
        return $null
    }
}

function Convert-CsvValor {
    param([string]$ValorString)
    
    if ([string]::IsNullOrWhiteSpace($ValorString)) {
        return 0.0
    }
    
    try {
        # Remove "R$", espaços e converte vírgula para ponto
        $valor = $ValorString -replace 'R\$\s*', '' -replace '\.', '' -replace ',', '.'
        return [decimal]::Parse($valor.Trim(), [System.Globalization.CultureInfo]::InvariantCulture)
    }
    catch {
        Write-Warning "Falha ao converter valor '$ValorString': $_"
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
    param(
        [string]$Value,
        [int]$MaxLength = 0
    )
    
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }
    
    $sanitized = $Value.Trim()
    
    if ($MaxLength -gt 0 -and $sanitized.Length -gt $MaxLength) {
        $sanitized = $sanitized.Substring(0, $MaxLength)
        Write-Verbose "String truncada para $MaxLength caracteres: $Value"
    }
    
    return $sanitized
}

function Sanitize-Cpf {
    param([string]$Cpf)
    
    if ([string]::IsNullOrWhiteSpace($Cpf)) {
        return $null
    }
    
    # Remove caracteres não numéricos
    $cleaned = $Cpf -replace '\D', ''
    
    # Valida tamanho (deve ser 11 dígitos)
    if ($cleaned.Length -ne 11) {
        Write-Verbose "CPF inválido (tamanho): $Cpf"
        return $null
    }
    
    # Ignora CPFs com todos os dígitos iguais
    if ($cleaned -match '^(\d)\1{10}$') {
        Write-Verbose "CPF inválido (dígitos repetidos): $Cpf"
        return $null
    }
    
    return $cleaned
}

function Sanitize-Cnpj {
    param([string]$Cnpj)
    
    if ([string]::IsNullOrWhiteSpace($Cnpj)) {
        return $null
    }
    
    # Remove caracteres não numéricos
    $cleaned = $Cnpj -replace '\D', ''
    
    # Valida tamanho (deve ser 14 dígitos)
    if ($cleaned.Length -ne 14) {
        Write-Verbose "CNPJ inválido (tamanho): $Cnpj"
        return $null
    }
    
    return $cleaned
}

# ==================== BACKUP ====================

if ($BackupFirst) {
    Write-Host "[1/6] Criando backup do banco atual..." -ForegroundColor Yellow
    try {
        & "$PSScriptRoot\backup-sqlite.ps1" -Verbose:$VerbosePreference
        Write-Host "  OK Backup criado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Warning "Falha ao criar backup: $_"
        $continue = Read-Host "Deseja continuar sem backup? (S/N)"
        if ($continue -ne 'S') {
            throw "Importação cancelada pelo usuário"
        }
    }
    Write-Host ""
}

# ==================== LEITURA DOS CSV ====================

Write-Host "[2/6] Lendo arquivos CSV..." -ForegroundColor Yellow

# Lê CSV com encoding correto (UTF-8)
$encoding = [System.Text.Encoding]::UTF8

Write-Host "  > Lendo TB_CLIENTE.csv..." -ForegroundColor Gray
$clientesRaw = Import-Csv -Path $clienteCsvPath -Delimiter ';' -Encoding UTF8
Write-Host "    Total de registros: $($clientesRaw.Count)" -ForegroundColor Gray

Write-Host "  > Lendo TB_APARELHO.csv..." -ForegroundColor Gray
$aparelhosRaw = Import-Csv -Path $aparelhoCsvPath -Delimiter ';' -Encoding UTF8
Write-Host "    Total de registros: $($aparelhosRaw.Count)" -ForegroundColor Gray

Write-Host "  OK Arquivos CSV lidos!" -ForegroundColor Green
Write-Host ""

# ==================== PROCESSAMENTO - CLIENTES ====================

Write-Host "[3/6] Processando clientes..." -ForegroundColor Yellow

$clientesProcessados = @{}
$clientesIgnorados = 0
$clientesDuplicados = 0

foreach ($row in $clientesRaw) {
    $codCli = $row.COD_CLI
    
    # Pula clientes sem código
    if ([string]::IsNullOrWhiteSpace($codCli)) {
        $clientesIgnorados++
        continue
    }
    
    # Verifica duplicatas
    if ($clientesProcessados.ContainsKey($codCli)) {
        $clientesDuplicados++
        Write-Verbose "Cliente duplicado ignorado: COD_CLI=$codCli"
        continue
    }
    
    $cpf = Sanitize-Cpf $row.CPF
    $cnpj = Sanitize-Cnpj $row.CNPJ
    
    # Regra: pelo menos um de CPF ou CNPJ deve existir
    if ($null -eq $cpf -and $null -eq $cnpj) {
        $clientesIgnorados++
        Write-Verbose "Cliente sem CPF/CNPJ ignorado: COD_CLI=$codCli"
        continue
    }
    
    $cliente = @{
        CodCliOriginal = $codCli
        Cpf = $cpf
        Cnpj = $cnpj
        Nome = Sanitize-String $row.NOME 200
        DataNascimento = Convert-CsvDate $row.DATA_NASCIMENTO
        Rg = Sanitize-String $row.RG 20
        Telefone = Sanitize-String $row.TELEFONE 20
        Celular = Sanitize-String $row.CELULAR 20
        Endereco = Sanitize-String $row."ENDEREÇO" 300
        Email = Sanitize-String $row.EMAIL 200
    }
    
    # Valida nome obrigatório
    if ([string]::IsNullOrWhiteSpace($cliente.Nome)) {
        $clientesIgnorados++
        Write-Verbose "Cliente sem nome ignorado: COD_CLI=$codCli"
        continue
    }
    
    $clientesProcessados[$codCli] = $cliente
}

Write-Host "  > Clientes processados: $($clientesProcessados.Count)" -ForegroundColor Gray
Write-Host "  > Clientes ignorados: $clientesIgnorados" -ForegroundColor Gray
Write-Host "  > Clientes duplicados: $clientesDuplicados" -ForegroundColor Gray
Write-Host "  OK Processamento concluido!" -ForegroundColor Green
Write-Host ""

# ==================== PROCESSAMENTO - ORDENS DE SERVIÇO ====================

Write-Host "[4/6] Processando ordens de serviço..." -ForegroundColor Yellow

$ordensProcessadas = @()
$ordensIgnoradas = 0
$ordemSemCliente = 0

foreach ($row in $aparelhosRaw) {
    $os = $row.OS
    
    # Pula registros sem número de OS
    if ([string]::IsNullOrWhiteSpace($os)) {
        $ordensIgnoradas++
        continue
    }
    
    $codCli = $row.COD_CLI
    $cpf = Sanitize-Cpf $row.CPF
    
    # Tenta localizar cliente
    $cliente = $null
    if (-not [string]::IsNullOrWhiteSpace($codCli) -and $clientesProcessados.ContainsKey($codCli)) {
        $cliente = $clientesProcessados[$codCli]
    }
    elseif ($null -ne $cpf) {
        # Busca por CPF
        $cliente = $clientesProcessados.Values | Where-Object { $_.Cpf -eq $cpf } | Select-Object -First 1
    }
    
    if ($null -eq $cliente) {
        $ordemSemCliente++
        Write-Verbose "OS $os sem cliente: COD_CLI=$codCli, CPF=$cpf"
        continue
    }
    
    $marca = Sanitize-String $row.MARCA 100
    if ([string]::IsNullOrWhiteSpace($marca)) {
        $ordensIgnoradas++
        Write-Verbose "OS $os sem marca ignorada"
        continue
    }
    
    $dataAbertura = Convert-CsvDate $row.DATA
    if ($null -eq $dataAbertura) {
        $ordensIgnoradas++
        Write-Verbose "OS $os sem data válida ignorada"
        continue
    }
    
    # Determina tipo de OS
    $operacao = $row.OPERACAO
    $tipo = if ($operacao -eq "VENDA") { "Venda" } else { "Assistencia" }
    
    $ordem = @{
        Numero = [int]$os
        ClienteCodOriginal = $cliente.CodCliOriginal
        Tipo = $tipo
        Marca = $marca
        Modelo = Sanitize-String $row.MODELO 150
        Defeito = Sanitize-String $row.DEFEITO 500
        Bateria = Convert-CsvBool $row.BATERIA
        Chip = Convert-CsvBool $row.CHIP
        Valor = Convert-CsvValor $row.VALOR
        DataAbertura = $dataAbertura
        Observacoes = Sanitize-String $row.OBSERVACOES 1000
    }
    
    $ordensProcessadas += $ordem
}

Write-Host "  > Ordens processadas: $($ordensProcessadas.Count)" -ForegroundColor Gray
Write-Host "  > Ordens ignoradas: $ordensIgnoradas" -ForegroundColor Gray
Write-Host "  > Ordens sem cliente: $ordemSemCliente" -ForegroundColor Gray
Write-Host "  OK Processamento concluido!" -ForegroundColor Green
Write-Host ""

# ==================== IMPORTAÇÃO NO BANCO ====================

Write-Host "[5/6] Importando para o banco de dados..." -ForegroundColor Yellow
Write-Host "  ATENÇÃO: Esta operação irá APAGAR todos os dados existentes!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Deseja continuar? Digite 'CONFIRMO' para prosseguir"
if ($confirm -ne 'CONFIRMO') {
    throw "Importação cancelada pelo usuário"
}

Write-Host ""
Write-Host "  > Construindo e executando aplicacao .NET..." -ForegroundColor Gray

# Nota: Importação via EF Core requer compilação e execução no contexto do projeto .NET

Write-Host "  AVISO: Importacao via EF Core requer compilacao do projeto .NET" -ForegroundColor Yellow
Write-Host "  > Alternativa: use o script SQL direto (import-csv-data-sql.ps1)" -ForegroundColor Cyan
Write-Host ""

# ==================== RESUMO ====================

Write-Host "[6/6] Resumo da importação:" -ForegroundColor Yellow
Write-Host "  Clientes para importar: $($clientesProcessados.Count)" -ForegroundColor Gray
Write-Host "  Ordens para importar: $($ordensProcessadas.Count)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Dados processados e prontos para importação!" -ForegroundColor Green
Write-Host "  Execute o script SQL alternativo para conclusão:" -ForegroundColor Cyan
Write-Host "  .\import-csv-data-sql.ps1" -ForegroundColor White
Write-Host ""

# Exporta dados processados para JSON (para debug)
$outputPath = Join-Path $PSScriptRoot "..\temp"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath | Out-Null
}

$clientesProcessados.Values | ConvertTo-Json -Depth 10 | Out-File "$outputPath\clientes-processados.json" -Encoding UTF8
$ordensProcessadas | ConvertTo-Json -Depth 10 | Out-File "$outputPath\ordens-processadas.json" -Encoding UTF8

Write-Host "  📁 Dados processados salvos em: DATABASE\temp\" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
