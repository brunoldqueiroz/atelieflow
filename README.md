# AteliêFlow

Sistema web de gestão operacional para ateliê de encadernação artesanal — controle de clientes, encomendas personalizadas e fluxo de produção em painel Kanban.

Projeto de Extensão Universitária (PEX V) — Análise e Desenvolvimento de Sistemas. Requisitos em [`docs/requirements.md`](docs/requirements.md).

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2 (SQLite), Pydantic v2 |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, @dnd-kit |
| Testes | pytest + TestClient (backend) · Vitest + Testing Library + MSW (frontend) |

## Escopo do piloto (RF01–RF05)

- **RF01** Cadastro de clientes com histórico de encomendas
- **RF02** Manutenção de tipos de produto (Caderno, Agenda, Caderneta de Vacina, Bloco de Notas)
- **RF03** Configuração das 5 etapas do pipeline (Orçado → Aguardando Arte → Em Produção → Pronto → Entregue)
- **RF04** Registro de encomendas com personalização, prazo e valores (total + sinal)
- **RF05** Painel Kanban ordenado pelas entregas mais urgentes, com drag-and-drop

RF06 (financeiro) pertence à fase de refinamento e não faz parte deste piloto.

## Como executar

### Backend (http://localhost:8000)

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

- Documentação interativa (Swagger): http://localhost:8000/docs
- O banco `atelieflow.db` (SQLite) é criado automaticamente na primeira execução, já com a carga inicial de tipos de produto e status do pipeline.

### Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Para apontar para outra URL de API: `VITE_API_URL=http://host:porta/api npm run dev`.

## Testes

```bash
# Backend (68 testes)
cd backend && uv run pytest

# Frontend (77 testes)
cd frontend && npm run test

# Build de produção do frontend
cd frontend && npm run build
```

## Estrutura

```
backend/
  app/
    main.py            # app FastAPI, CORS, lifespan (create_all + seed)
    database.py        # engine SQLite com PRAGMA foreign_keys
    models.py          # 4 tabelas em 3FN conforme o documento de requisitos
    schemas.py         # validação Pydantic (ex.: sinal ≤ total)
    seed.py            # carga inicial idempotente
    routers/           # clientes, tipos_produto, status_encomenda, encomendas, kanban
  tests/               # pytest com SQLite em memória
frontend/
  src/
    services/api.js    # camada HTTP da API REST
    pages/             # Kanban, Encomendas, FormEncomenda, Clientes, Configurações
    components/kanban/ # Board, Column e Card com drag-and-drop
    utils/             # formatação (data, moeda, prazo) e mapa de cores
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
