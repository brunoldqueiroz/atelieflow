"""Schemas Pydantic do AteliêFlow — validação estrita de entrada e saída."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ---------- Tipos de produto (RF02) ----------


class TipoProdutoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    ativo: bool = True


class TipoProdutoCreate(TipoProdutoBase):
    pass


class TipoProdutoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=60)
    ativo: bool | None = None


class TipoProdutoResponse(TipoProdutoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------- Status da encomenda (RF03) ----------


class StatusEncomendaBase(BaseModel):
    nome: str = Field(min_length=1, max_length=40)
    ordem: int = Field(ge=1)
    cor_badge: str | None = Field(default=None, max_length=20)


class StatusEncomendaCreate(StatusEncomendaBase):
    pass


class StatusEncomendaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=40)
    ordem: int | None = Field(default=None, ge=1)
    cor_badge: str | None = Field(default=None, max_length=20)


class StatusEncomendaResponse(StatusEncomendaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ---------- Clientes (RF01) ----------


class ClienteBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    telefone: str = Field(min_length=1, max_length=20)
    observacoes: str | None = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=120)
    telefone: str | None = Field(default=None, min_length=1, max_length=20)
    observacoes: str | None = None


class ClienteResponse(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ClienteDetalheResponse(ClienteResponse):
    encomendas: list["EncomendaResumoResponse"] = []


# ---------- Encomendas (RF04) ----------


class EncomendaBase(BaseModel):
    cliente_id: int
    tipo_produto_id: int
    status_id: int
    detalhes_personalizacao: str = Field(min_length=1)
    data_entrega_prevista: date
    valor_total: Decimal = Field(ge=Decimal("0"), max_digits=10, decimal_places=2)
    valor_sinal: Decimal = Field(
        default=Decimal("0.00"), ge=Decimal("0"), max_digits=10, decimal_places=2
    )
    observacoes_internas: str | None = None

    @model_validator(mode="after")
    def sinal_nao_pode_superar_total(self):
        if self.valor_sinal > self.valor_total:
            raise ValueError("valor_sinal não pode ser maior que valor_total")
        return self


class EncomendaCreate(EncomendaBase):
    pass


class EncomendaUpdate(BaseModel):
    cliente_id: int | None = None
    tipo_produto_id: int | None = None
    status_id: int | None = None
    detalhes_personalizacao: str | None = Field(default=None, min_length=1)
    data_entrega_prevista: date | None = None
    valor_total: Decimal | None = Field(
        default=None, ge=Decimal("0"), max_digits=10, decimal_places=2
    )
    valor_sinal: Decimal | None = Field(
        default=None, ge=Decimal("0"), max_digits=10, decimal_places=2
    )
    observacoes_internas: str | None = None


class EncomendaStatusUpdate(BaseModel):
    status_id: int


class EncomendaResponse(EncomendaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    data_pedido: datetime


class EncomendaDetalheResponse(EncomendaResponse):
    cliente: ClienteResponse
    tipo_produto: TipoProdutoResponse
    status: StatusEncomendaResponse


class EncomendaResumoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    detalhes_personalizacao: str
    data_entrega_prevista: date
    valor_total: Decimal
    valor_sinal: Decimal
    tipo_produto: TipoProdutoResponse
    status: StatusEncomendaResponse


# ---------- Kanban (RF05) ----------


class KanbanColunaResponse(BaseModel):
    status: StatusEncomendaResponse
    encomendas: list[EncomendaResumoResponse]


ClienteDetalheResponse.model_rebuild()
