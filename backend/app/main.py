from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401 — registra as tabelas no metadata
from .database import SessionLocal
from .routers import clientes, encomendas, kanban, status_encomenda, tipos_produto
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # O schema é criado pelas migrações do Alembic (upgrade head), não aqui.
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="AteliêFlow API",
    description="Gestão operacional de encomendas para ateliê de encadernação artesanal",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(clientes.router, prefix="/api/clientes", tags=["clientes"])
app.include_router(
    tipos_produto.router, prefix="/api/tipos-produto", tags=["tipos de produto"]
)
app.include_router(
    status_encomenda.router, prefix="/api/status-encomenda", tags=["status"]
)
app.include_router(encomendas.router, prefix="/api/encomendas", tags=["encomendas"])
app.include_router(kanban.router, prefix="/api/kanban", tags=["kanban"])


@app.get("/api/health", tags=["saúde"])
def health():
    return {"status": "ok"}
