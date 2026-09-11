from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import e_sqlite, obter_database_url

DATABASE_URL = obter_database_url()

_connect_args = {"check_same_thread": False} if e_sqlite(DATABASE_URL) else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)

if e_sqlite(DATABASE_URL):

    @event.listens_for(engine, "connect")
    def _ativar_foreign_keys(dbapi_connection, _connection_record):
        """SQLite não aplica FKs por padrão; PostgreSQL as impõe nativamente."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
