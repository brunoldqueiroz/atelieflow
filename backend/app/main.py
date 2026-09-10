from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401 — registra as tabelas no metadata
from .database import Base, SessionLocal, engine
from .routers import clientes
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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


@app.get("/api/health", tags=["saúde"])
def health():
    return {"status": "ok"}
