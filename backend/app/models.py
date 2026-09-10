"""Modelo relacional do AteliêFlow — fiel ao documento de requisitos (seção 5, 3FN)."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    encomendas: Mapped[list["Encomenda"]] = relationship(back_populates="cliente")


class TipoProduto(Base):
    __tablename__ = "tipos_produto"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    encomendas: Mapped[list["Encomenda"]] = relationship(back_populates="tipo_produto")


class StatusEncomenda(Base):
    __tablename__ = "status_encomenda"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    ordem: Mapped[int] = mapped_column(nullable=False)
    cor_badge: Mapped[str | None] = mapped_column(String(20), nullable=True)

    encomendas: Mapped[list["Encomenda"]] = relationship(back_populates="status")


class Encomenda(Base):
    __tablename__ = "encomendas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id"), nullable=False, index=True
    )
    tipo_produto_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_produto.id"), nullable=False
    )
    status_id: Mapped[int] = mapped_column(
        ForeignKey("status_encomenda.id"), nullable=False, index=True
    )
    detalhes_personalizacao: Mapped[str] = mapped_column(Text, nullable=False)
    data_pedido: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    data_entrega_prevista: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    valor_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    valor_sinal: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    observacoes_internas: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship(back_populates="encomendas")
    tipo_produto: Mapped["TipoProduto"] = relationship(back_populates="encomendas")
    status: Mapped["StatusEncomenda"] = relationship(back_populates="encomendas")
