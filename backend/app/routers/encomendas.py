"""RF04 — Registro e orçamentação de encomendas."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter()

_CARGA_RELACIONADA = (
    selectinload(models.Encomenda.cliente),
    selectinload(models.Encomenda.tipo_produto),
    selectinload(models.Encomenda.status),
)


def _consulta_completa(db: Session):
    return db.query(models.Encomenda).options(*_CARGA_RELACIONADA)


def _obter_encomenda_ou_404(encomenda_id: int, db: Session) -> models.Encomenda:
    encomenda = (
        _consulta_completa(db).filter(models.Encomenda.id == encomenda_id).first()
    )
    if encomenda is None:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return encomenda


def _validar_cliente(cliente_id: int, db: Session) -> None:
    if db.get(models.Cliente, cliente_id) is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")


def _validar_tipo_produto(tipo_produto_id: int, db: Session) -> None:
    tipo = db.get(models.TipoProduto, tipo_produto_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de produto não encontrado")
    if not tipo.ativo:
        raise HTTPException(
            status_code=400, detail="Tipo de produto inativo não aceita novas encomendas"
        )


def _validar_status(status_id: int, db: Session) -> None:
    if db.get(models.StatusEncomenda, status_id) is None:
        raise HTTPException(status_code=404, detail="Status não encontrado")


@router.get("", response_model=list[schemas.EncomendaDetalheResponse])
def listar_encomendas(
    status_id: int | None = None,
    cliente_id: int | None = None,
    db: Session = Depends(get_db),
):
    consulta = _consulta_completa(db)
    if status_id is not None:
        consulta = consulta.filter(models.Encomenda.status_id == status_id)
    if cliente_id is not None:
        consulta = consulta.filter(models.Encomenda.cliente_id == cliente_id)
    return consulta.order_by(
        models.Encomenda.data_entrega_prevista, models.Encomenda.id
    ).all()


@router.post("", response_model=schemas.EncomendaDetalheResponse, status_code=201)
def criar_encomenda(dados: schemas.EncomendaCreate, db: Session = Depends(get_db)):
    _validar_cliente(dados.cliente_id, db)
    _validar_tipo_produto(dados.tipo_produto_id, db)
    _validar_status(dados.status_id, db)

    encomenda = models.Encomenda(**dados.model_dump())
    db.add(encomenda)
    db.commit()
    return _obter_encomenda_ou_404(encomenda.id, db)


@router.get("/{encomenda_id}", response_model=schemas.EncomendaDetalheResponse)
def obter_encomenda(encomenda_id: int, db: Session = Depends(get_db)):
    return _obter_encomenda_ou_404(encomenda_id, db)


@router.put("/{encomenda_id}", response_model=schemas.EncomendaDetalheResponse)
def atualizar_encomenda(
    encomenda_id: int, dados: schemas.EncomendaUpdate, db: Session = Depends(get_db)
):
    encomenda = _obter_encomenda_ou_404(encomenda_id, db)
    alteracoes = dados.model_dump(exclude_unset=True)

    if "cliente_id" in alteracoes:
        _validar_cliente(alteracoes["cliente_id"], db)
    if "tipo_produto_id" in alteracoes:
        _validar_tipo_produto(alteracoes["tipo_produto_id"], db)
    if "status_id" in alteracoes:
        _validar_status(alteracoes["status_id"], db)

    novo_total = alteracoes.get("valor_total", encomenda.valor_total)
    novo_sinal = alteracoes.get("valor_sinal", encomenda.valor_sinal)
    if novo_sinal > novo_total:
        raise HTTPException(
            status_code=422, detail="valor_sinal não pode ser maior que valor_total"
        )

    for campo, valor in alteracoes.items():
        setattr(encomenda, campo, valor)
    db.commit()
    return _obter_encomenda_ou_404(encomenda_id, db)


@router.patch("/{encomenda_id}/status", response_model=schemas.EncomendaDetalheResponse)
def mover_status(
    encomenda_id: int, dados: schemas.EncomendaStatusUpdate, db: Session = Depends(get_db)
):
    encomenda = _obter_encomenda_ou_404(encomenda_id, db)
    _validar_status(dados.status_id, db)
    encomenda.status_id = dados.status_id
    db.commit()
    return _obter_encomenda_ou_404(encomenda_id, db)


@router.delete("/{encomenda_id}", status_code=204)
def excluir_encomenda(encomenda_id: int, db: Session = Depends(get_db)):
    encomenda = _obter_encomenda_ou_404(encomenda_id, db)
    db.delete(encomenda)
    db.commit()
