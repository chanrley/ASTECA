# Scripts de Importação de Dados

## 🎯 Escolha o Script Certo

### ✅ RECOMENDADO: Versão Docker

Use quando:
- Você tem Docker instalado (padrão do projeto)
- Não quer instalar SQLite no host
- Quer isolamento e segurança

```powershell
.\import-csv-data-docker.ps1 -Verbose
```

### ⚠️ Versão SQL Direta (requer SQLite no host)

Use apenas se:
- Não pode usar Docker
- Já tem sqlite3.exe instalado no PATH

```powershell
.\import-csv-data-sql.ps1 -Verbose
```

## 📚 Documentação

- **GUIA-RAPIDO-DOCKER.md** - Guia de 2 passos para importação
- **README-IMPORTACAO.md** - Documentação técnica completa
- **GUIA-RAPIDO.md** - Guia para versão SQL direta (legado)

## 🔧 Scripts Disponíveis

| Script | Função | Docker | SQLite Host |
|--------|--------|--------|-------------|
| `import-csv-data-docker.ps1` | Importação completa | ✅ Sim | ❌ Não |
| `validate-import-docker.ps1` | Validação | ✅ Sim | ❌ Não |
| `import-csv-data-sql.ps1` | Importação legado | ❌ Não | ✅ Sim |
| `validate-import.ps1` | Validação legado | ❌ Não | ✅ Sim |
| `import-csv-data.ps1` | Processa CSV (debug) | ❌ Não | ❌ Não |

## 🚀 Início Rápido

```powershell
# 1. Entre na pasta de scripts
cd C:\tools\ASTECA\DATABASE\scripts

# 2. Execute importação (via Docker - recomendado)
.\import-csv-data-docker.ps1

# 3. Valide os dados
.\validate-import-docker.ps1
```

## 📊 Mapeamento de Dados

### TB_CLIENTE.csv → Clientes

- **COD_CLI** usado para relacionamento interno
- **CPF/CNPJ** validado e sanitizado (remove formatação)
- **Datas** convertidas: `dd-MMM-yy` → `yyyy-MM-dd`
- **Nome** obrigatório, max 200 chars
- **Pelo menos um**: CPF ou CNPJ

### TB_APARELHO.csv → OrdensServico

- **OS** → Numero (único)
- **Código** gerado automaticamente: `V-001` (Venda) ou `A-001` (Assistência)
- **OPERACAO** → Tipo: `"VENDA"` → `Venda`, outros → `Assistencia`
- **BATERIA/CHIP** → `"VERDADEIRO"` → `1`, `"FALSO"` → `0`
- **VALOR** → `"R$ 250,00"` → `250.00`
- **Status** → sempre `"Entregue"` (dados legados)

## 🔄 Fluxo de Importação

```
1. Backup do banco atual (automático)
   DATABASE/backups/asteca.db.backup-YYYYMMDD-HHMMSS.db

2. Leitura dos CSV (UTF-8)
   TB_CLIENTE.csv
   TB_APARELHO.csv

3. Validação e conversão
   - Datas, valores, booleanos
   - CPF/CNPJ
   - Relacionamentos

4. Geração de SQL
   - DELETE dados existentes
   - INSERT clientes
   - INSERT ordens
   - INSERT histórico

5. Execução via Docker
   - Container temporário Alpine + sqlite3
   - Executa SQL no volume asteca_db
   - Remove container

6. Validação (opcional)
   - Contagens
   - Integridade referencial
   - Constraints
```

## ⚠️ O Que Será Deletado

Antes de importar, o script **APAGA**:
- ✅ Todos os clientes
- ✅ Todas as ordens de serviço
- ✅ Todo o histórico

**PRESERVADO:**
- ✅ Usuário `admin`
- ✅ Estrutura das tabelas (schema)

## 🔒 Segurança

- Backup automático antes de qualquer operação
- Transação SQL (rollback em caso de erro)
- Foreign keys validadas
- Confirmação manual obrigatória (`CONFIRMO`)
- Volume Docker isolado

## 📈 Estatísticas Esperadas

Baseado nos CSV atuais:

- **Clientes**: ~650 registros
  - PF (CPF): ~600
  - PJ (CNPJ): ~50
- **Ordens**: ~580 registros válidos
  - Vendas: ~575
  - Assistências: ~5
- **Ignorados**: ~50-100 (sem CPF/CNPJ ou cliente)
- **Tempo**: 20-40 segundos

## 🐛 Troubleshooting

### Docker não encontrado

```
Erro: docker : The term 'docker' is not recognized...
```

**Solução**: Instale Docker Desktop e reinicie o terminal

### Volume não existe

```
Erro: Error response from daemon: volume asteca_db not found
```

**Solução**: Execute `docker-compose up` primeiro para criar o volume

### Arquivo CSV não encontrado

```
Erro: Arquivo nao encontrado: TB_CLIENTE.csv
```

**Solução**: Execute da pasta `DATABASE\scripts` ou use `-CsvPath`

### Erro de parsing PowerShell

```
ParserError: The '<' operator is reserved...
```

**Solução**: Use `import-csv-data-docker.ps1` (corrigido para Docker)

## 🔙 Reverter Importação

### Listar backups disponíveis

```powershell
Get-ChildItem ..\backups\*.db | Sort-Object LastWriteTime -Descending
```

### Restaurar backup específico

```powershell
$backup = "..\backups\asteca.db.backup-20260624-123456.db"

# Criar container temporário
docker run -d --name restore-temp -v asteca_db:/data alpine tail -f /dev/null

# Copiar backup
docker cp $backup restore-temp:/data/asteca.db

# Limpar
docker stop restore-temp
docker rm restore-temp
```

## 📞 Suporte

1. Leia `GUIA-RAPIDO-DOCKER.md` primeiro
2. Execute com `-Verbose` para detalhes
3. Verifique logs do Docker
4. Confirme que CSV estão em UTF-8

## 🔗 Links Úteis

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [PowerShell ISE](https://docs.microsoft.com/powershell/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Versão**: 2.0 (Docker-based)
**Última atualização**: 2026-06-24
