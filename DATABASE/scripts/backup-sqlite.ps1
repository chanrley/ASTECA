<#
Copia o asteca.db do volume Docker do backend para DATABASE/backups, com timestamp.
Uso: rode da raiz do repo ou de qualquer pasta — o script resolve os caminhos por si.
#>

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$backupsDir = Join-Path $repoRoot "DATABASE\backups"
New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null

$containerId = docker compose -f (Join-Path $repoRoot "INFRA\docker-compose.yml") ps -q backend
if (-not $containerId) {
    throw "Container do backend não está rodando. Rode 'docker compose up -d' antes do backup."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destino = Join-Path $backupsDir "asteca-$timestamp.db"

docker cp "${containerId}:/data/asteca.db" $destino

Write-Host "Backup salvo em $destino"
