# AteliêFlow

Sistema web de gestão operacional para ateliê de encadernação artesanal — controle de clientes, encomendas personalizadas e fluxo de produção em painel Kanban.

Projeto de Extensão Universitária (PEX V) — Análise e Desenvolvimento de Sistemas. Requisitos em [`docs/requirements.md`](docs/requirements.md).

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic (migrações) |
| Banco de dados | PostgreSQL 17 (acesso multiusuário: app + read-only para integrações) |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, @dnd-kit, nginx |
| Infraestrutura | Docker Compose (db, backend, frontend, backup) |
| Testes | pytest + TestClient (backend) · Vitest + Testing Library + MSW (frontend) |

## Escopo do piloto (RF01–RF05)

- **RF01** Cadastro de clientes com histórico de encomendas
- **RF02** Manutenção de tipos de produto (Caderno, Agenda, Caderneta de Vacina, Bloco de Notas)
- **RF03** Configuração das 5 etapas do pipeline (Orçado → Aguardando Arte → Em Produção → Pronto → Entregue)
- **RF04** Registro de encomendas com personalização, prazo e valores (total + sinal)
- **RF05** Painel Kanban ordenado pelas entregas mais urgentes, com drag-and-drop

RF06 (financeiro) pertence à fase de refinamento e não faz parte deste piloto.

## Quickstart — Docker (recomendado)

Pré-requisito: Docker com Compose. Sobe os 4 serviços (banco, API, SPA e backup):

```bash
cp .env.example .env      # ajuste as senhas
docker compose build
docker compose up -d
```

- **Aplicação**: http://localhost:5173 (SPA; `/api` é proxied pelo nginx para o backend — mesmo domínio, sem CORS)
- **API/Swagger**: http://localhost:8000/docs
- Na primeira subida: o banco é inicializado, o usuário read-only é criado, as migrações são aplicadas (`alembic upgrade head`) e a carga inicial (tipos de produto + status) é inserida.

Parar: `docker compose down` · Parar apagando os dados: `docker compose down -v`

## Desenvolvimento local (app/frontend fora do Docker)

```bash
# 1. Banco de dados via Docker (ou PostgreSQL local na 5432)
docker compose up -d db

# 2. Backend — http://localhost:8000
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# 3. Frontend — http://localhost:5173
cd frontend
npm install
npm run dev
```

Para apontar o backend para outro banco: `DATABASE_URL=postgresql+psycopg://usuario:senha@host:5432/banco`.

## Testes

```bash
# Backend — 72 testes (SQLite em memória por padrão)
cd backend && uv run pytest

# Backend — mesma suíte contra PostgreSQL real
TEST_DATABASE_URL=postgresql+psycopg://atelieflow:senha@localhost:5432/atelieflow_test uv run pytest

# Frontend — 77 testes
cd frontend && npm run test

# Build de produção do frontend
cd frontend && npm run build
```

## Acesso ao banco de dados (multiusuário)

Dois usuários são provisionados — preparado para futuras integrações de AI/BI:

| Usuário | Permissões | Uso |
|---|---|---|
| `atelieflow` (POSTGRES_USER) | Leitura/escrita total | API e migrações Alembic |
| `atelieflow_leitura` | **Somente SELECT** (tabelas atuais e futuras) | Integrações de AI, BI, relatórios |

A porta 5432 é exposta no host conforme `DB_BIND` no `.env` (`127.0.0.1` = só esta máquina; `0.0.0.0` = acessível na LAN):

```
postgresql://atelieflow_leitura:<LEITURA_PASSWORD>@localhost:5432/atelieflow
```

Verificação rápida:

```bash
# SELECT permitido
docker compose exec -e PGPASSWORD=<LEITURA_PASSWORD> db \
  psql -U atelieflow_leitura -d atelieflow -c 'SELECT count(*) FROM encomendas'

# INSERT negado (permission denied)
docker compose exec -e PGPASSWORD=<LEITURA_PASSWORD> db \
  psql -U atelieflow_leitura -d atelieflow -c "INSERT INTO clientes (nome, telefone) VALUES ('x','0')"
```

## Backup e restore

O serviço `backup` roda `pg_dump` diariamente às **03:00**, compactado em gzip, com **retenção de 14 dias** (volume Docker `backups`).

```bash
# Backup manual imediato
docker compose exec backup /usr/local/bin/backup.sh

# Listar backups
docker compose exec backup ls -lh /backups/

# Restore em banco novo (ex.: validação)
docker compose exec db createdb -U atelieflow restauracao
docker compose exec backup sh -c 'gunzip -c /backups/atelieflow-AAAAMMDD-HHMMSS.sql.gz' \
  | docker compose exec -T db psql -U atelieflow restauracao
```

## Estrutura

```
backend/
  app/
    main.py            # app FastAPI, CORS, lifespan (seed idempotente)
    config.py          # DATABASE_URL via ambiente
    database.py        # engine SQLAlchemy (PRAGMA de FKs apenas para SQLite)
    models.py          # 4 tabelas em 3FN conforme o documento de requisitos
    schemas.py         # validação Pydantic (ex.: sinal ≤ total)
    seed.py            # carga inicial idempotente
    routers/           # clientes, tipos_produto, status_encomenda, encomendas, kanban
  alembic/             # migrações versionadas do schema
  tests/               # pytest (SQLite em memória ou TEST_DATABASE_URL)
frontend/
  src/
    services/api.js    # camada HTTP da API REST
    pages/             # Kanban, Encomendas, FormEncomenda, Clientes, Configurações
    components/kanban/ # Board, Column e Card com drag-and-drop
    utils/             # formatação (data, moeda, prazo) e mapa de cores
  nginx.conf           # SPA fallback + proxy /api → backend
db/init/               # criação do usuário read-only (1ª inicialização)
backup/                # pg_dump agendado (crond) com retenção
docker-compose.yml     # orquestração: db, backend, frontend, backup
```

## API principal

| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/clientes` | CRUD de clientes (GET por id inclui histórico) |
| GET/POST/PUT/DELETE | `/api/tipos-produto` | Tipos de produto (`?apenas_ativos=true`) |
| GET/POST/PUT/DELETE | `/api/status-encomenda` | Etapas do pipeline ordenadas |
| GET/POST/PUT/DELETE | `/api/encomendas` | Encomendas (filtros `status_id`, `cliente_id`) |
| PATCH | `/api/encomendas/{id}/status` | Move a encomenda no pipeline |
| GET | `/api/kanban` | Colunas com cards ordenados por urgência |

