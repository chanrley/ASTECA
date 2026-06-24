# Schema do banco (SQLite)

Fonte de verdade real: migrations do EF Core em `BACKEND/src/Asteca.Infrastructure/Migrations/`. Este arquivo é uma referência de leitura rápida, não a fonte autoritativa.

## Clientes
| Coluna | Tipo | Observações |
|---|---|---|
| Id | INTEGER PK | identity |
| Cpf | TEXT, nullable | único (permite múltiplos NULL); pessoa física |
| Cnpj | TEXT, nullable | único (permite múltiplos NULL); pessoa jurídica |
| Nome | TEXT, obrigatório | |
| DataNascimento | TEXT (DateOnly), nullable | formato yyyy-MM-dd |
| Rg | TEXT, nullable | |
| Telefone | TEXT, nullable | |
| Celular | TEXT, nullable | |
| Endereco | TEXT, nullable | |
| Email | TEXT, nullable | |

Regra (validada na API, não em constraint do banco): exatamente um de Cpf/Cnpj deve estar preenchido.

## OrdensServico
| Coluna | Tipo | Observações |
|---|---|---|
| Id | INTEGER PK | identity |
| Numero | INTEGER, único | número sequencial visível ao usuário |
| Codigo | TEXT, único | "A-106" (Assistência) / "V-095" (Venda) |
| ClienteId | INTEGER FK → Clientes.Id | delete Restrict |
| Tipo | TEXT (enum como string) | Assistencia \| Venda |
| Chip | INTEGER (bool) | |
| Bateria | INTEGER (bool) | |
| Marca | TEXT, obrigatório | |
| Modelo | TEXT, nullable | |
| Defeito | TEXT, nullable | |
| Valor | TEXT (decimal 10,2) | |
| DataAbertura | TEXT (DateOnly) | só a data, sem hora — é como o negócio trata esse campo |
| Status | TEXT (enum como string) | Aberta \| EmAndamento \| AguardandoPeca \| Pronto \| Entregue \| Cancelada |
| Observacoes | TEXT, nullable | |

## HistoricoEventos
| Coluna | Tipo | Observações |
|---|---|---|
| Id | INTEGER PK | identity |
| OrdemServicoId | INTEGER FK → OrdensServico.Id | delete Cascade |
| Evento | TEXT, obrigatório | |
| DataHora | TEXT (DateTime) | hora local "ingênua" (sem timezone) — loja opera em um único fuso |

## Usuarios
| Coluna | Tipo | Observações |
|---|---|---|
| Id | INTEGER PK | identity |
| NomeUsuario | TEXT, único | login |
| SenhaHash | TEXT | hash BCrypt, nunca texto puro |
| Papel | TEXT (enum como string) | Gestor \| Atendente |
| NomeExibicao | TEXT | exibido na TopBar |
| Ativo | INTEGER (bool) | |

## Datas: por que não há conversão de timezone
A loja opera em um único fuso (Brasil). Todos os timestamps são tratados como hora de parede local, gravados e exibidos sem conversão UTC↔local — isso evita a classe inteira de bugs de "dia errado" que apareceria se tentássemos tratar SQLite (que não preserva `DateTimeKind`) como fonte de instantes UTC reais. Ver `OrdemServico.Agora()` no domínio.
