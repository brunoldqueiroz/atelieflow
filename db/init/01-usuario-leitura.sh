#!/bin/bash
# Cria o usuário read-only para integrações (AI/BI/relatórios).
# Executado uma única vez, na primeira inicialização do volume pgdata.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
    CREATE USER atelieflow_leitura WITH PASSWORD '${LEITURA_PASSWORD}';
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO atelieflow_leitura;
    GRANT USAGE ON SCHEMA public TO atelieflow_leitura;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO atelieflow_leitura;
    ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
        GRANT SELECT ON TABLES TO atelieflow_leitura;
SQL

echo "[init] usuário atelieflow_leitura criado com acesso read-only"
