"""Carga inicial do AteliêFlow (seção 6 do documento de requisitos)."""

from sqlalchemy.orm import Session

from .models import StatusEncomenda, TipoProduto

TIPOS_PRODUTO_PADRAO = ["Caderno", "Agenda", "Caderneta de Vacina", "Bloco de Notas"]

STATUS_PADRAO = [
    ("Orçado", 1, "slate"),
    ("Aguardando Arte", 2, "amber"),
    ("Em Produção", 3, "blue"),
    ("Pronto", 4, "emerald"),
    ("Entregue", 5, "violet"),
]


def seed_database(db: Session) -> None:
    """Insere tipos de produto e status do pipeline de forma idempotente."""
    tipos_existentes = {t.nome for t in db.query(TipoProduto).all()}
    for nome in TIPOS_PRODUTO_PADRAO:
        if nome not in tipos_existentes:
            db.add(TipoProduto(nome=nome, ativo=True))

    status_existentes = {s.nome for s in db.query(StatusEncomenda).all()}
    for nome, ordem, cor_badge in STATUS_PADRAO:
        if nome not in status_existentes:
            db.add(StatusEncomenda(nome=nome, ordem=ordem, cor_badge=cor_badge))

    db.commit()
