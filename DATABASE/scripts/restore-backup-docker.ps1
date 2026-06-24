<#
.SYNOPSIS
    Restaura backup do banco via Docker.

.PARAMETER BackupPath
    Caminho para o arquivo de backup.

.EXAMPLE
    .\restore-backup-docker.ps1 -BackupPath "..\backups\asteca.db.backup-20260624-123456.db"
    
.EXAMPLE
    # Lista e escolhe interativamente
    .\restore-backup-docker.ps1
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$BackupPath,

    [Parameter()]
    [string]$VolumeName = "infra_asteca_db"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTORE de Backup via Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Se não foi passado backup, lista disponíveis
if ([string]::IsNullOrWhiteSpace($BackupPath)) {
    $backupDir = Join-Path $PSScriptRoot "..\backups"
    
    if (-not (Test-Path $backupDir)) {
        throw "Diretorio de backups nao encontrado: $backupDir"
    }
    
    $backups = Get-ChildItem -Path $backupDir -Filter "*.db" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        throw "Nenhum backup encontrado em: $backupDir"
    }
    
    Write-Host "Backups disponiveis:" -ForegroundColor Yellow
    Write-Host ""
    
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $size = [math]::Round($backup.Length / 1KB, 2)
        Write-Host "  [$($i+1)] $($backup.Name)" -ForegroundColor White
        Write-Host "      Data: $($backup.LastWriteTime)" -ForegroundColor Gray
        Write-Host "      Tamanho: $size KB" -ForegroundColor Gray
        Write-Host ""
    }
    
    $escolha = Read-Host "Escolha o backup (1-$($backups.Count)) ou 'C' para cancelar"
    
    if ($escolha -eq 'C' -or $escolha -eq 'c') {
        Write-Host "Cancelado pelo usuario" -ForegroundColor Yellow
        return
    }
    
    try {
        $index = [int]$escolha - 1
        if ($index -lt 0 -or $index -ge $backups.Count) {
            throw "Opcao invalida"
        }
        $BackupPath = $backups[$index].FullName
    }
    catch {
        throw "Opcao invalida: $escolha"
    }
}

# Verifica se backup existe
if (-not (Test-Path $BackupPath)) {
    throw "Backup nao encontrado: $BackupPath"
}

$backupFile = Get-Item $BackupPath
Write-Host "Backup selecionado:" -ForegroundColor Yellow
Write-Host "  Arquivo: $($backupFile.Name)" -ForegroundColor White
Write-Host "  Data: $($backupFile.LastWriteTime)" -ForegroundColor White
Write-Host "  Tamanho: $([math]::Round($backupFile.Length / 1KB, 2)) KB" -ForegroundColor White
Write-Host ""

Write-Host "ATENCAO: Isso vai SUBSTITUIR o banco atual!" -ForegroundColor Red
$confirm = Read-Host "Digite 'SIM' para confirmar"

if ($confirm -ne 'SIM') {
    Write-Host "Cancelado" -ForegroundColor Yellow
    return
}

Write-Host ""
Write-Host "Restaurando..." -ForegroundColor Yellow

# Para containers existentes
$containerName = "asteca-restore-temp"
docker stop $containerName 2>$null | Out-Null
docker rm $containerName 2>$null | Out-Null

# Cria container temporário
Write-Host "  > Criando container temporario..." -ForegroundColor Gray
docker run -d --name $containerName -v "${VolumeName}:/data" alpine:latest tail -f /dev/null | Out-Null

# Copia backup para o volume
Write-Host "  > Copiando backup para volume Docker..." -ForegroundColor Gray
docker cp $BackupPath "${containerName}:/data/asteca.db"

if ($LASTEXITCODE -ne 0) {
    docker stop $containerName | Out-Null
    docker rm $containerName | Out-Null
    throw "Erro ao copiar backup"
}

# Remove container
Write-Host "  > Limpando..." -ForegroundColor Gray
docker stop $containerName | Out-Null
docker rm $containerName | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTORE CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Banco restaurado para: $($backupFile.LastWriteTime)" -ForegroundColor White
Write-Host ""
Write-Host "Para validar, execute:" -ForegroundColor Cyan
Write-Host "  .\validate-import-docker.ps1" -ForegroundColor White
Write-Host ""
