# Guia Rápido - Importação de Dados CSV

## 🚀 Início Rápido (3 passos)

### 1. Instalar SQLite Command Line

```powershell
# Via Chocolatey (recomendado)
choco install sqlite

# Ou baixe manualmente de:
# https://www.sqlite.org/download.html
# Extraia sqlite3.exe e adicione ao PATH
```

### 2. Executar Importação

```powershell
cd C:\tools\ASTECA\DATABASE\scripts
.\import-csv-data-sql.ps1 -Verbose
```

Confirme digitando: `CONFIRMO`

### 3. Validar Resultados

```powershell
.\validate-import.ps1
```

## 📋 O que será importado?

- **Clientes**: ~650 registros de `TB_CLIENTE.csv`
- **Ordens de Serviço**: ~7.100 registros de `TB_APARELHO.csv`
- **Histórico**: 1 evento por ordem (criação)

## ⚠️ IMPORTANTE

- **Backup automático**: Criado antes da importação
- **Dados mockados**: Serão **APAGADOS** completamente
- **Usuário admin**: Será **PRESERVADO**
- **Tempo estimado**: 10-30 segundos

## 🔄 Scripts Dispon

íveis

| Script | Função | Quando usar |
|--------|---------|-------------|
| `import-csv-data.ps1` | Análise e validação | Debug, verificar dados antes de importar |
| `import-csv-data-sql.ps1` | **Importação** | Importar dados definitivamente |
| `validate-import.ps1` | Validação pós-importação | Verificar se deu tudo certo |
| `backup-sqlite.ps1` | Backup manual | Criar backup adicional |
| `restore-sqlite.ps1` | Restaura backup | Reverter importação |

## 📊 Exemplos

### Importar sem backup

```powershell
.\import-csv-data-sql.ps1 -BackupFirst $false
```

### Importar de outro diretório

```powershell
.\import-csv-data-sql.ps1 -CsvPath "C:\meus-dados"
```

### Validar com detalhes

```powershell
.\validate-import.ps1 -Verbose
```

## 🆘 Problemas Comuns

**"sqlite3.exe não encontrado"**
→ Instale SQLite e adicione ao PATH

**"Arquivo não encontrado: TB_CLIENTE.csv"**
→ Execute na pasta DATABASE\scripts ou use -CsvPath

**"FOREIGN KEY constraint failed"**
→ Bug no script, reporte no GitHub

**"CPFs duplicados"**
→ Os scripts tratam automaticamente, primeira ocorrência vence

## 🔙 Reverter Importação

```powershell
# Lista backups disponíveis
Get-ChildItem ..\backups\*.db

# Restaura backup específico
.\restore-sqlite.ps1 -BackupPath "..\backups\asteca.db.backup-20260624-160530.db"
```

## 📝 Documentação Completa

Para detalhes técnicos, conversões de dados, troubleshooting etc:
→ Leia `README-IMPORTACAO.md`

---

**Versão:** 1.0
**Data:** 2026-06-24
