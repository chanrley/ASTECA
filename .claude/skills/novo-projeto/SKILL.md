---
name: novo-projeto
description: Cria um projeto novo (fullstack) a partir do template ASTECA, delegando o backend ao agente csharp-dev e o frontend ao agente react-dev. Use quando o usuário pedir para criar um projeto novo "usando os agentes react dev e c# dev" ou "baseado no ASTECA" — ex. "criar um projeto de hamburgueria".
user-invocable: true
---

Argumentos passados: `$ARGUMENTS` (nome do projeto e/ou descrição livre do domínio, ex: "hamburgueria — pedidos, cardápio, entregadores")

## O que esta skill faz
Cria um projeto fullstack novo (BACKEND .NET + FRONTEND React + DATABASE) reproduzindo a arquitetura do ASTECAWEB, mas para um domínio diferente. Os agentes `csharp-dev` e `react-dev` (em `.claude/agents/`) conhecem os padrões técnicos exatos — esta skill só orquestra.

## Passo a passo

1. **Entender o domínio.** Se `$ARGUMENTS` não trouxer entidades/fluxos suficientes, pergunte ao usuário: nome do projeto, principais entidades (ex: Pedido, Cliente, ItemCardapio), e o fluxo de status principal (ex: Recebido → EmPreparo → Pronto → Entregue). Não assuma um domínio genérico de e-commerce sem confirmar.

2. **Definir o destino.** Crie a estrutura em `../<nome-do-projeto>` (irmã da pasta atual do ASTECAWEB, tanto faz se a sessão é local ou um sandbox remoto/mobile clonado do repo). Pastas: `BACKEND/`, `FRONTEND/`, `DATABASE/{seed,docs,scripts}`, `INFRA/`.

3. **Delegar o backend ao agente `csharp-dev`** (via Task/Agent): peça para escaffoldar os três projetos .NET (`<Nome>.Domain`, `<Nome>.Infrastructure`, `<Nome>.Api`) com as entidades e o fluxo de estado definidos no passo 1, seguindo a arquitetura documentada no agente.

4. **Delegar o frontend ao agente `react-dev`** (via Task/Agent), depois que o backend definir os DTOs/endpoints: peça para escaffoldar o `FRONTEND/` com páginas, hooks e rotas para as mesmas entidades, batendo com os contratos do passo 3.

5. **Banco de dados.** Garanta que o `DbSeeder` carregue de um JSON em `DATABASE/seed/`, idêntico ao padrão do ASTECA (idempotente, só semeia se a tabela estiver vazia).

6. **Git.** Rode `git init` no novo projeto e faça o primeiro commit. **Não crie repositório remoto nem faça push sem confirmar com o usuário antes** — isso é necessário para acesso via celular (sessões remotas do Claude operam sobre repositórios GitHub), mas é uma ação visível/externa.

7. **Resumo final.** Liste o que foi criado, o que falta (ex: configurar `appsettings.json`, rodar `dotnet restore`, `npm install`) e, se o usuário confirmou o passo 6, o link do repositório.

## Regras
- Não duplique aqui o conhecimento de convenções — isso vive nos agentes `csharp-dev` e `react-dev`. Esta skill só decide *quando* chamar cada um e garante que backend e frontend fiquem alinhados antes de finalizar.
- Sempre rode o agente de backend antes do de frontend, porque o frontend depende dos contratos (DTOs/endpoints) definidos pelo backend.
