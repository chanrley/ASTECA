<#
Restaura um backup de DATABASE/backups para o volume Docker do backend.
Uso: .\restore-sqlite.ps1 -BackupFile asteca-20260624-153000.db
ATENÇÃO: sobrescreve o banco atual do container. Pare o backend antes de restaurar
para evitar escritas concorrentes durante a cópia.
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$backupPath = Join-Path $repoRoot "DATABASE\backups\$BackupFile"
if (-not (Test-Path $backupPath)) {
    throw "Arquivo de backup não encontrado: $backupPath"
}

$composeFile = Join-Path $repoRoot "INFRA\docker-compose.yml"
$containerId = docker compose -f $composeFile ps -q backend
if (-not $containerId) {
    throw "Container do backend não está rodando. Rode 'docker compose up -d' primeiro (para o volume existir)."
}

Write-Host "Parando o backend antes de restaurar..."
docker compose -f $composeFile stop backend

docker cp $backupPath "${containerId}:/data/asteca.db"

Write-Host "Restaurado. Reiniciando o backend..."
docker compose -f $composeFile start backend

Write-Host "Concluído."
