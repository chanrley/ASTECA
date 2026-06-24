# Importação de Dados CSV para SQLite

Este documento descreve o processo de importação dos dados legados dos arquivos `TB_CLIENTE.csv` e `TB_APARELHO.csv` para o banco de dados SQLite do sistema ASTECA.

## 📋 Pré-requisitos

- **PowerShell 5.1+** (Windows)
- **SQLite CLI** (`sqlite3.exe`) no PATH
  - Download: https://www.sqlite.org/download.html
  - Ou via Chocolatey: `choco install sqlite`
- Arquivos CSV na raiz do projeto:
  - `TB_CLIENTE.csv`
  - `TB_APARELHO.csv`

## 🚀 Scripts Disponíveis

### 1. `import-csv-data.ps1` (Análise e Processamento)

Script principal que lê, valida e processa os arquivos CSV. Exporta dados processados em JSON para debug.

**Funcionalidades:**
- ✅ Leitura dos CSV com encoding UTF-8
- ✅ Validação e sanitização de dados
- ✅ Conversão de formatos (datas, valores, booleanos)
- ✅ Tratamento de CPF/CNPJ
- ✅ Relacionamento Cliente ↔ Ordem de Serviço
- ✅ Backup automático do banco atual
- ✅ Exportação em JSON para análise

**Uso:**
```powershell
cd DATABASE\scripts
.\import-csv-data.ps1 -Verbose
```

### 2. `import-csv-data-sql.ps1` (Importação SQL Direto) ⭐ **RECOMENDADO**

Script otimizado que gera e executa SQL direto no SQLite, sem depender do EF Core.

**Funcionalidades:**
- ✅ Importação rápida via SQL nativo
- ✅ Limpeza automática de dados mockados
- ✅ Preserva usuário admin
- ✅ Gera códigos automáticos (A-001, V-001)
- ✅ Cria histórico inicial para cada OS
- ✅ Status padrão: "Entregue" (dados já finalizados)
- ✅ Backup opcional

**Uso:**
```powershell
cd DATABASE\scripts
.\import-csv-data-sql.ps1 -Verbose
```

**Parâmetros:**
```powershell
# Caminho customizado do banco
.\import-csv-data-sql.ps1 -DbPath "C:\outro\caminho\banco.db"

# Sem backup automático
.\import-csv-data-sql.ps1 -BackupFirst $false

# CSV em outro diretório
.\import-csv-data-sql.ps1 -CsvPath "C:\dados\csv"
```

## 📊 Mapeamento de Dados

### TB_CLIENTE.csv → Tabela Clientes

| CSV | Banco | Transformação |
|-----|-------|---------------|
| COD_CLI | Id | Mapeado (usado internamente) |
| CPF | Cpf | Remove formatação, valida |
| CNPJ | Cnpj | Remove formatação, valida |
| NOME | Nome | Sanitiza, max 200 chars |
| DATA_NASCIMENTO | DataNascimento | `dd-MMM-yy` → `yyyy-MM-dd` |
| RG | Rg | Sanitiza, max 20 chars |
| TELEFONE | Telefone | Sanitiza, max 20 chars |
| CELULAR | Celular | Sanitiza, max 20 chars |
| ENDEREÇO | Endereco | Sanitiza, max 300 chars |
| EMAIL | Email | Sanitiza, max 200 chars |

### TB_APARELHO.csv → Tabela OrdensServico

| CSV | Banco | Transformação |
|-----|-------|---------------|
| OS | Numero | Número sequencial |
| - | Codigo | Gerado: `V-001` ou `A-001` |
| COD_CLI/CPF | ClienteId | FK para Clientes |
| OPERACAO | Tipo | `VENDA` → `Venda`, outros → `Assistencia` |
| MARCA | Marca | Obrigatório, max 100 chars |
| MODELO | Modelo | Opcional, max 150 chars |
| DEFEITO | Defeito | Opcional, max 500 chars |
| BATERIA | Bateria | `VERDADEIRO`/`FALSO` → `1`/`0` |
| CHIP | Chip | `VERDADEIRO`/`FALSO` → `1`/`0` |
| VALOR | Valor | `R$ 250,00` → `250.00` |
| DATA | DataAbertura | `29-mar-16` → `2016-03-29` |
| - | Status | Fixo: `Entregue` |
| OBSERVACOES | Observacoes | Opcional, max 1000 chars |

## 🔧 Conversões Implementadas

### Datas
```powershell
"29-mar-16"           → "2016-03-29"
"20/10/2023 13:31:29" → "2023-10-20"
```

### Valores Monetários
```powershell
"R$ 250,00"  → 250.00
"R$ 1.250,00" → 1250.00
""           → 0.00
```

### Booleanos
```powershell
"VERDADEIRO" → 1
"FALSO"      → 0
""           → 0
```

### CPF/CNPJ
```powershell
"391.264.098-01"  → "39126409801"
"12.345.678/0001-90" → "12345678000190"
```

## 📌 Regras de Validação

### Clientes
- ✅ **Nome obrigatório** (max 200 chars)
- ✅ **Pelo menos um**: CPF **ou** CNPJ
- ✅ CPF: 11 dígitos, sem repetição (111.111.111-11 inválido)
- ✅ CNPJ: 14 dígitos
- ⚠️ Clientes duplicados ignorados (primeiro vence)
- ⚠️ Clientes sem documento ignorados

### Ordens de Serviço
- ✅ **Número de OS obrigatório**
- ✅ **Cliente deve existir** (via COD_CLI ou CPF)
- ✅ **Marca obrigatória** (max 100 chars)
- ✅ **Data válida obrigatória**
- ⚠️ OS sem cliente ignorada
- ⚠️ OS sem marca ignorada
- ⚠️ OS sem data válida ignorada

## 🗑️ Limpeza de Dados

O script realiza limpeza completa antes da importação:

```sql
-- Remove histórico (cascata)
DELETE FROM HistoricoEventos;

-- Remove ordens
DELETE FROM OrdensServico;

-- Remove clientes
DELETE FROM Clientes;

-- Preserva admin
DELETE FROM Usuarios WHERE NomeUsuario != 'admin';

-- Reseta IDs
DELETE FROM sqlite_sequence WHERE name IN ('Clientes', 'OrdensServico', 'HistoricoEventos');
```

## 💾 Backup Automático

Por padrão, um backup é criado antes da importação:

```
INFRA/data/asteca.db.backup-20260624-160530.db
```

Para desabilitar:
```powershell
.\import-csv-data-sql.ps1 -BackupFirst $false
```

## 📝 Histórico de Eventos

Para cada ordem importada, um evento inicial é criado:

```
Evento: "Ordem de serviço criada (importação de dados legados)"
DataHora: <DataAbertura>T10:00:00
```

## ⚠️ Tratamento de Erros

### Problemas Comuns

**1. SQLite não encontrado**
```
Erro: sqlite3.exe não encontrado no PATH
Solução: Instale SQLite CLI e adicione ao PATH
```

**2. Encoding incorreto**
```
Erro: Caracteres especiais corrompidos
Solução: Os scripts usam UTF-8 automaticamente
```

**3. Foreign Key violation**
```
Erro: FOREIGN KEY constraint failed
Solução: O script processa clientes primeiro, depois ordens
```

**4. Duplicatas de CPF/CNPJ**
```
Erro: UNIQUE constraint failed: Clientes.Cpf
Solução: Primeira ocorrência vence, demais ignoradas
```

## 📂 Estrutura de Arquivos

```
DATABASE/
├── scripts/
│   ├── import-csv-data.ps1          # Script principal (processamento)
│   ├── import-csv-data-sql.ps1      # Script SQL direto (RECOMENDADO)
│   ├── backup-sqlite.ps1            # Backup manual
│   ├── restore-sqlite.ps1           # Restore manual
│   └── README-IMPORTACAO.md         # Este documento
├── temp/
│   ├── clientes-processados.json    # Debug: clientes processados
│   └── ordens-processadas.json      # Debug: ordens processadas
└── backups/
    └── asteca.db.backup-*.db        # Backups automáticos
```

## 🧪 Teste a Importação

### Passo 1: Dry Run (Análise)
```powershell
# Apenas processa e valida, sem importar
.\import-csv-data.ps1 -Verbose

# Verifique os arquivos JSON gerados
code ..\temp\clientes-processados.json
code ..\temp\ordens-processadas.json
```

### Passo 2: Importação Real
```powershell
# Importa para o banco
.\import-csv-data-sql.ps1 -Verbose
```

### Passo 3: Validação
```powershell
# Verifique os dados no banco
sqlite3 ..\..\INFRA\data\asteca.db

sqlite> SELECT COUNT(*) FROM Clientes;
sqlite> SELECT COUNT(*) FROM OrdensServico;
sqlite> SELECT * FROM Clientes LIMIT 5;
sqlite> SELECT * FROM OrdensServico LIMIT 5;
sqlite> .quit
```

## 📊 Estatísticas Esperadas

Com base na análise dos CSV:

- **Clientes**: ~650+ registros
- **Ordens de Serviço**: ~7.100+ registros
- **Clientes ignorados**: ~50-100 (sem CPF/CNPJ ou nome)
- **Ordens ignoradas**: ~10-20 (sem cliente ou sem marca)
- **Tempo de importação**: 10-30 segundos

## 🔄 Reverter Importação

Se algo der errado, restaure o backup:

```powershell
# Via script
.\restore-sqlite.ps1 -BackupPath "..\backups\asteca.db.backup-20260624-160530.db"

# Ou manualmente
Copy-Item "..\backups\asteca.db.backup-*.db" "..\..\INFRA\data\asteca.db" -Force
```

## 🐛 Troubleshooting

### Verbose Mode
Para ver todos os detalhes:
```powershell
.\import-csv-data-sql.ps1 -Verbose
```

### Debug Mode
Para ver warnings e erros detalhados:
```powershell
$VerbosePreference = "Continue"
.\import-csv-data-sql.ps1
```

### Logs
Verifique arquivos JSON intermediários:
```powershell
Get-Content ..\temp\clientes-processados.json | ConvertFrom-Json | Format-Table
Get-Content ..\temp\ordens-processadas.json | ConvertFrom-Json | Format-Table
```

## 📞 Suporte

Em caso de problemas:
1. Execute com `-Verbose` para detalhes
2. Verifique os arquivos JSON gerados
3. Confirme encoding UTF-8 dos CSV
4. Valide que sqlite3.exe está no PATH
5. Verifique permissões de arquivo no banco

---

**Última atualização:** 2026-06-24
**Versão dos scripts:** 1.0
