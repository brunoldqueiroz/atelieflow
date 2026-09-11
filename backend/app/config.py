"""Configuração de infraestrutura do AteliêFlow via variáveis de ambiente."""

import os

DATABASE_URL_PADRAO = (
    "postgresql+psycopg://atelieflow:atelieflow@localhost:5432/atelieflow"
)


def obter_database_url() -> str:
    """URL de conexão SQLAlchemy; default aponta para o PostgreSQL local."""
    return os.environ.get("DATABASE_URL", DATABASE_URL_PADRAO)


def e_sqlite(url: str) -> bool:
    """SQLite exige PRAGMA de FKs e connect_args próprios; PostgreSQL não."""
    return url.startswith("sqlite")
