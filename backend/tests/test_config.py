"""Configuração de acesso ao banco via variáveis de ambiente."""

from app.config import DATABASE_URL_PADRAO, e_sqlite, obter_database_url


class TestObterDatabaseUrl:
    def test_padrao_e_postgres_local(self, monkeypatch):
        monkeypatch.delenv("DATABASE_URL", raising=False)

        url = obter_database_url()

        assert url == DATABASE_URL_PADRAO
        assert url.startswith("postgresql+psycopg://")
        assert "localhost:5432" in url

    def test_respeita_variavel_de_ambiente(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@db:5432/app")

        assert obter_database_url() == "postgresql+psycopg://u:p@db:5432/app"


class TestESqlite:
    def test_urls_sqlite_sao_detectadas(self):
        assert e_sqlite("sqlite://") is True
        assert e_sqlite("sqlite:///./atelieflow.db") is True

    def test_urls_postgres_nao_sao_sqlite(self):
        assert e_sqlite("postgresql+psycopg://u:p@db:5432/app") is False
