# Guia Rápido - Importação via Docker

## 🚀 Início Rápido (2 passos - SEM INSTALAR NADA!)

### 1. Executar Importação

```powershell
cd C:\tools\ASTECA\DATABASE\scripts
.\import-csv-data-docker.ps1 -Verbose
```

Confirme digitando: `CONFIRMO`

(ou use `-Force` para pular a confirmação interativa em execuções automatizadas/sem console, ex.: scripts CI ou agentes)

### 2. Validar Resultados

```powershell
.\validate-import-docker.ps1
```

## ✅ Vantagens da Versão Docker

- **Sem instalação**: Não precisa instalar SQLite no host
- **Isolado**: Usa container Alpine Linux temporário
- **Seguro**: Volume Docker persistente
- **Backup automático**: Exporta do Docker antes de importar

## 📋 O que acontece?

1. **Backup**: Exporta `asteca.db` do volume Docker
2. **Processamento**: Lê e valida CSV no PowerShell
3. **Geração SQL**: Cria comandos INSERT
4. **Execução**: Container temporário executa SQL
5. **Limpeza**: Container é removido automaticamente

## 🐳 Requisitos

- Docker Desktop instalado e rodando
- Volume Docker `infra_asteca_db` criado (pelo `docker-compose up` executado em `INFRA/`; o Compose prefixa o nome `asteca_db` do `docker-compose.yml` com o nome do projeto `infra`)

## 📊 Dados Importados

- **~650 clientes** de `TB_CLIENTE.csv`
- **~7.100 ordens** de `TB_APARELHO.csv`  
- **~7.100 eventos** de histórico

## ⚠️ IMPORTANTE

- Dados mockados de Clientes/Ordens serão **APAGADOS**
- Tabela `Usuarios` (`gestor`/`atendente`) **NÃO é tocada** pelo import
- Backup criado em `DATABASE/backups/`
- Tempo: ~20-40 segundos (inclui download Alpine)

## 🔄 Como Funciona

```
CSV Locais (Host)
    ↓ PowerShell processa
SQL gerado
    ↓ Monta como volume no container
Docker Alpine + sqlite3
    ↓ Executa SQL
Volume asteca_db atualizado
```

## 🆘 Problemas?

**"Docker não encontrado"**
→ Instale Docker Desktop: https://www.docker.com/products/docker-desktop

**"Volume asteca_db não existe"**
→ Execute `docker-compose up` primeiro para criar

**"Permissão negada"**
→ Execute PowerShell como Administrador

**"CSV não encontrado"**
→ Execute da pasta `DATABASE\scripts`

## 🔙 Reverter Importação

```powershell
# Listar backups
Get-ChildItem ..\backups\*.db

# Restaurar backup específico
$backupFile = "..\backups\asteca.db.backup-20260624-160530.db"

# Criar container temporário
docker run -d --name restore-temp -v infra_asteca_db:/data alpine:latest tail -f /dev/null

# Copiar backup de volta
docker cp $backupFile restore-temp:/data/asteca.db

# Remover container
docker stop restore-temp
docker rm restore-temp
```

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `import-csv-data-docker.ps1` | **Importação via Docker** (USE ESTE!) |
| `validate-import-docker.ps1` | Validação via Docker |
| `import-csv-data-sql.ps1` | ❌ Requer SQLite no host (NÃO USE) |
| `import-csv-data.ps1` | Apenas processa CSV (para debug) |

## 🔍 Verificar Volume Docker

```powershell
# Ver volumes
docker volume ls

# Inspecionar volume
docker volume inspect infra_asteca_db

# Acessar banco manualmente
docker run --rm -it -v infra_asteca_db:/data alpine:latest sh
# (dentro do container)
apk add sqlite
sqlite3 /data/asteca.db
.tables
SELECT COUNT(*) FROM Clientes;
.quit
exit
```

## ⏱️ Tempo Estimado

- **Primeira vez**: ~40s (download Alpine ~5MB)
- **Execuções seguintes**: ~20s (Alpine em cache)

---

**Versão:** 2.0 (Docker)
**Data:** 2026-06-24
