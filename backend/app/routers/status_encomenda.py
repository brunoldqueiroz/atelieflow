"""RF03 — Configuração sequencial das etapas do pipeline de confecção."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


def _obter_status_ou_404(status_id: int, db: Session) -> models.StatusEncomenda:
    status = db.get(models.StatusEncomenda, status_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Status não encontrado")
    return status


@router.get("", response_model=list[schemas.StatusEncomendaResponse])
def listar_status(db: Session = Depends(get_db)):
    return db.query(models.StatusEncomenda).order_by(models.StatusEncomenda.ordem).all()


@router.post("", response_model=schemas.StatusEncomendaResponse, status_code=201)
def criar_status(dados: schemas.StatusEncomendaCreate, db: Session = Depends(get_db)):
    existe = (
        db.query(models.StatusEncomenda)
        .filter(models.StatusEncomenda.nome == dados.nome)
        .first()
    )
    if existe is not None:
        raise HTTPException(status_code=409, detail="Já existe um status com este nome")
    status = models.StatusEncomenda(**dados.model_dump())
    db.add(status)
    db.commit()
    db.refresh(status)
    return status


@router.put("/{status_id}", response_model=schemas.StatusEncomendaResponse)
def atualizar_status(
    status_id: int, dados: schemas.StatusEncomendaUpdate, db: Session = Depends(get_db)
):
    status = _obter_status_ou_404(status_id, db)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(status, campo, valor)
    db.commit()
    db.refresh(status)
    return status


@router.delete("/{status_id}", status_code=204)
def excluir_status(status_id: int, db: Session = Depends(get_db)):
    status = _obter_status_ou_404(status_id, db)
    if status.encomendas:
        raise HTTPException(
            status_code=409,
            detail="Status possui encomendas vinculadas e não pode ser excluído",
        )
    db.delete(status)
    db.commit()
