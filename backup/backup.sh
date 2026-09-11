#!/bin/sh
# Backup diário do PostgreSQL do AteliêFlow.
# Usa as variáveis padrão PGHOST/PGUSER/PGPASSWORD/PGDATABASE do ambiente.
set -e

ARQUIVO="/backups/atelieflow-$(date +%Y%m%d-%H%M%S).sql.gz"

pg_dump --format=plain --clean --if-exists | gzip > "$ARQUIVO"
echo "[backup] gerado: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

# Retenção: remove backups com mais de 14 dias
find /backups -name 'atelieflow-*.sql.gz' -mtime +14 -delete
echo "[backup] retenção de 14 dias aplicada"
