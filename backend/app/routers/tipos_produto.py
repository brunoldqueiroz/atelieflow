"""RF02 — Manutenção paramétrica de tipos de produto."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


def _obter_tipo_ou_404(tipo_id: int, db: Session) -> models.TipoProduto:
    tipo = db.get(models.TipoProduto, tipo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de produto não encontrado")
    return tipo


def _garantir_nome_unico(nome: str, db: Session, ignorar_id: int | None = None) -> None:
    consulta = db.query(models.TipoProduto).filter(models.TipoProduto.nome == nome)
    if ignorar_id is not None:
        consulta = consulta.filter(models.TipoProduto.id != ignorar_id)
    if consulta.first() is not None:
        raise HTTPException(
            status_code=409, detail="Já existe um tipo de produto com este nome"
        )


@router.get("", response_model=list[schemas.TipoProdutoResponse])
def listar_tipos(apenas_ativos: bool = False, db: Session = Depends(get_db)):
    consulta = db.query(models.TipoProduto)
    if apenas_ativos:
        consulta = consulta.filter(models.TipoProduto.ativo.is_(True))
    return consulta.order_by(models.TipoProduto.nome).all()


@router.post("", response_model=schemas.TipoProdutoResponse, status_code=201)
def criar_tipo(dados: schemas.TipoProdutoCreate, db: Session = Depends(get_db)):
    _garantir_nome_unico(dados.nome, db)
    tipo = models.TipoProduto(**dados.model_dump())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.put("/{tipo_id}", response_model=schemas.TipoProdutoResponse)
def atualizar_tipo(
    tipo_id: int, dados: schemas.TipoProdutoUpdate, db: Session = Depends(get_db)
):
    tipo = _obter_tipo_ou_404(tipo_id, db)
    alteracoes = dados.model_dump(exclude_unset=True)
    if "nome" in alteracoes:
        _garantir_nome_unico(alteracoes["nome"], db, ignorar_id=tipo_id)
    for campo, valor in alteracoes.items():
        setattr(tipo, campo, valor)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.delete("/{tipo_id}", status_code=204)
def excluir_tipo(tipo_id: int, db: Session = Depends(get_db)):
    tipo = _obter_tipo_ou_404(tipo_id, db)
    if tipo.encomendas:
        raise HTTPException(
            status_code=409,
            detail="Tipo de produto possui encomendas vinculadas; desative-o em vez de excluir",
        )
    db.delete(tipo)
    db.commit()
