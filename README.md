# ASTECA — IZZI Celulares

Sistema de gestão para a IZZI Celulares (venda e assistência técnica de celulares, Osasco-SP) — reescrita web do sistema legado em Microsoft Access "ASTECA". Controla clientes, ordens de serviço (OS) e tem um painel gerencial (dashboard) que não existia no sistema original.

## Stack

- **Backend**: .NET 8 / ASP.NET Core Web API + Entity Framework Core
- **Frontend**: React 18 + TypeScript + Vite
- **Banco**: SQLite3
- **Infra**: Docker + docker-compose + Nginx

## Estrutura do repositório

```
BACKEND/     API .NET 8 (Asteca.Domain / Asteca.Infrastructure / Asteca.Api)
DATABASE/    seed de dados, docs de schema/ER, scripts de backup/restore
FRONTEND/    app React (Vite)
INFRA/       Dockerfiles, docker-compose.yml, config do Nginx
```

## Credenciais de teste

O seed cria 2 usuários (senha de demonstração, igual para os dois — troque antes de qualquer uso real):

| Usuário | Senha | Papel | O que muda |
|---|---|---|---|
| `gestor` | `Izzi@2026` | Gestor | Único papel com acesso ao Dashboard (Início) |
| `atendente` | `Izzi@2026` | Atendente | Vê Ordens, Clientes e Consultar — sem Dashboard |

---

## Opção 1 — Rodar com Docker (recomendado)

Pré-requisitos: Docker e Docker Compose.

```bash
cd INFRA
cp .env.example .env
```

Edite `.env` e troque `JWT_SECRET` por uma string aleatória longa (o backend se recusa a iniciar com o valor de exemplo). Pode gerar uma rapidamente com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Depois suba o stack:

```bash
docker compose up --build
```

- Acesse **http://localhost:8081** e faça login com as credenciais acima.
- A API fica acessível só através do Nginx (rota `/api`), não exposta diretamente.
- Os dados ficam no volume nomeado `asteca_db` — sobrevivem a `docker compose restart`/`stop`/`up` (só se perdem com `docker compose down -v`).

Parar tudo: `docker compose down` (preserva o volume) ou `docker compose down -v` (apaga os dados também).

---

## Opção 2 — Rodar localmente sem Docker (desenvolvimento)

Pré-requisitos: .NET 8 SDK, Node.js 20+.

### Backend

```bash
cd BACKEND/src/Asteca.Api
dotnet run
```

Sobe em `http://localhost:5080` (porta fixada em `Properties/launchSettings.json`), já em modo Development — usa o secret de JWT de `appsettings.Development.json` (só para dev local, não usar em produção) e roda as migrations + o seed automaticamente na primeira execução, criando `asteca.db` ao lado do executável.

Swagger disponível em `http://localhost:5080/swagger`.

### Frontend

Em outro terminal:

```bash
cd FRONTEND
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite já está configurado (`vite.config.ts`) para fazer proxy de `/api` para `http://localhost:5080`, então o backend precisa estar rodando antes.

Acesse **http://localhost:5173** e faça login com as credenciais acima.

### Resetar o banco local

```bash
rm BACKEND/src/Asteca.Api/asteca.db
```

Ele é recriado e re-semeado automaticamente na próxima `dotnet run`.

---

## Testando

- **API isolada**: arquivo [`BACKEND/requests.http`](BACKEND/requests.http) (extensão REST Client do VS Code, ou copie os comandos como `curl`) cobre login, CRUD de clientes, criação de OS, transições de status (avançar/cancelar/aguardar peça) e os casos de erro esperados.
- **Aplicação completa**: com o backend (e o frontend, local ou via Docker) no ar, percorra manualmente: login com os dois papéis → criar uma OS nova → avançar o status até Entregue → ver refletido no Dashboard (só como Gestor) → consultar por nº de OS e por CPF → trocar de tema → gerar um recibo.

## Scripts úteis

- `DATABASE/scripts/backup-sqlite.ps1` — copia o `asteca.db` do volume Docker para `DATABASE/backups/` com timestamp.
- `DATABASE/scripts/restore-sqlite.ps1 -BackupFile <arquivo>` — restaura um backup para o volume Docker.
- `DATABASE/docs/schema.md` e `DATABASE/docs/er-diagram.md` — referência do schema.

## Notas

- Sem tela de "trocar senha" no momento — a senha de seed é fixa e deve ser substituída antes de qualquer deploy real.
- O frontend original (protótipo gerado no Claude Design) está preservado em `FRONTEND/reference/`, como referência visual.
