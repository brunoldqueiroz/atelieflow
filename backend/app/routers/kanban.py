"""RF05 — Painel visual da esteira de confecção (Kanban)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.get("", response_model=list[schemas.KanbanColunaResponse])
def obter_kanban(db: Session = Depends(get_db)):
    """Colunas na sequência do pipeline; cards pelas entregas mais urgentes."""
    colunas = []
    status_ordenados = (
        db.query(models.StatusEncomenda).order_by(models.StatusEncomenda.ordem).all()
    )
    for status in status_ordenados:
        encomendas = (
            db.query(models.Encomenda)
            .options(
                selectinload(models.Encomenda.cliente),
                selectinload(models.Encomenda.tipo_produto),
                selectinload(models.Encomenda.status),
            )
            .filter(models.Encomenda.status_id == status.id)
            .order_by(models.Encomenda.data_entrega_prevista, models.Encomenda.id)
            .all()
        )
        colunas.append({"status": status, "encomendas": encomendas})
    return colunas
