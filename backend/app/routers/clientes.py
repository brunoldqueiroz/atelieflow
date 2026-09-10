"""RF01 — Cadastro e manutenção de clientes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter()


def _obter_cliente_ou_404(cliente_id: int, db: Session) -> models.Cliente:
    cliente = db.get(models.Cliente, cliente_id)
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.get("", response_model=list[schemas.ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).order_by(models.Cliente.nome).all()


@router.post("", response_model=schemas.ClienteResponse, status_code=201)
def criar_cliente(dados: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente = models.Cliente(**dados.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=schemas.ClienteDetalheResponse)
def obter_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = (
        db.query(models.Cliente)
        .options(
            selectinload(models.Cliente.encomendas).selectinload(
                models.Encomenda.tipo_produto
            ),
            selectinload(models.Cliente.encomendas).selectinload(models.Encomenda.status),
        )
        .filter(models.Cliente.id == cliente_id)
        .first()
    )
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.put("/{cliente_id}", response_model=schemas.ClienteResponse)
def atualizar_cliente(
    cliente_id: int, dados: schemas.ClienteUpdate, db: Session = Depends(get_db)
):
    cliente = _obter_cliente_ou_404(cliente_id, db)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(cliente, campo, valor)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def excluir_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = _obter_cliente_ou_404(cliente_id, db)
    if cliente.encomendas:
        raise HTTPException(
            status_code=409,
            detail="Cliente possui encomendas vinculadas e não pode ser excluído",
        )
    db.delete(cliente)
    db.commit()
