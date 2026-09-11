import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Default: SQLite em memória (rápido, sem serviço externo).
# Para rodar a suíte contra o PostgreSQL: TEST_DATABASE_URL=postgresql+psycopg://...
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "sqlite://")

if TEST_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _ativar_foreign_keys(dbapi_connection, _connection_record):
        """Garante integridade referencial no SQLite também nos testes."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(TEST_DATABASE_URL)


TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def criar_tabelas():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    sessao = TestingSessionLocal()
    try:
        yield sessao
    finally:
        sessao.close()


@pytest.fixture
def client(db):
    """TestClient com banco SQLite em memória isolado (lifespan não executado)."""

    def _get_db_override():
        yield db

    app.dependency_overrides[get_db] = _get_db_override
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
