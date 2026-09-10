"""RF01 — Cadastro e manutenção de clientes."""

from datetime import date
from decimal import Decimal

import pytest

from app import models


def _criar_cliente(client, **sobreescrito):
    dados = {"nome": "Maria Silva", "telefone": "(41) 99999-0001"}
    dados.update(sobreescrito)
    return client.post("/api/clientes", json=dados)


def _criar_encomenda_direto_no_banco(db, cliente_id):
    tipo = models.TipoProduto(nome="Caderno", ativo=True)
    status = models.StatusEncomenda(nome="Orçado", ordem=1, cor_badge="slate")
    db.add_all([tipo, status])
    db.flush()
    encomenda = models.Encomenda(
        cliente_id=cliente_id,
        tipo_produto_id=tipo.id,
        status_id=status.id,
        detalhes_personalizacao="Capa rosa com nome bordado",
        data_entrega_prevista=date(2026, 10, 1),
        valor_total=Decimal("120.00"),
        valor_sinal=Decimal("50.00"),
    )
    db.add(encomenda)
    db.commit()
    return encomenda


class TestCriarCliente:
    def test_retorna_201_e_dados_cadastrados(self, client):
        resposta = _criar_cliente(client, observacoes="Prefere laminação fosca")

        assert resposta.status_code == 201
        dados = resposta.json()
        assert dados["id"] > 0
        assert dados["nome"] == "Maria Silva"
        assert dados["telefone"] == "(41) 99999-0001"
        assert dados["observacoes"] == "Prefere laminação fosca"

    def test_observacoes_e_opcional(self, client):
        resposta = _criar_cliente(client)

        assert resposta.status_code == 201
        assert resposta.json()["observacoes"] is None

    def test_sem_nome_retorna_422(self, client):
        resposta = client.post("/api/clientes", json={"telefone": "(41) 99999-0001"})
        assert resposta.status_code == 422

    def test_sem_telefone_retorna_422(self, client):
        resposta = client.post("/api/clientes", json={"nome": "Maria Silva"})
        assert resposta.status_code == 422

    def test_nome_acima_de_120_caracteres_retorna_422(self, client):
        resposta = _criar_cliente(client, nome="M" * 121)
        assert resposta.status_code == 422

    def test_telefone_acima_de_20_caracteres_retorna_422(self, client):
        resposta = _criar_cliente(client, telefone="9" * 21)
        assert resposta.status_code == 422


class TestListarClientes:
    def test_lista_vazia_inicialmente(self, client):
        resposta = client.get("/api/clientes")

        assert resposta.status_code == 200
        assert resposta.json() == []

    def test_retorna_clientes_ordenados_por_nome(self, client):
        _criar_cliente(client, nome="Zuleica Souza")
        _criar_cliente(client, nome="Ana Pereira")

        resposta = client.get("/api/clientes")

        assert [c["nome"] for c in resposta.json()] == ["Ana Pereira", "Zuleica Souza"]


class TestObterCliente:
    def test_retorna_cliente_por_id(self, client):
        cliente_id = _criar_cliente(client).json()["id"]

        resposta = client.get(f"/api/clientes/{cliente_id}")

        assert resposta.status_code == 200
        assert resposta.json()["nome"] == "Maria Silva"
        assert resposta.json()["encomendas"] == []

    def test_cliente_inexistente_retorna_404(self, client):
        resposta = client.get("/api/clientes/999")
        assert resposta.status_code == 404

    def test_detalhe_inclui_historico_de_encomendas(self, client, db):
        cliente_id = _criar_cliente(client).json()["id"]
        _criar_encomenda_direto_no_banco(db, cliente_id)

        resposta = client.get(f"/api/clientes/{cliente_id}")

        assert resposta.status_code == 200
        historico = resposta.json()["encomendas"]
        assert len(historico) == 1
        assert historico[0]["tipo_produto"]["nome"] == "Caderno"
        assert historico[0]["status"]["nome"] == "Orçado"
        assert historico[0]["data_entrega_prevista"] == "2026-10-01"
        assert float(historico[0]["valor_total"]) == 120.00


class TestAtualizarCliente:
    def test_atualiza_campos_parcialmente(self, client):
        cliente_id = _criar_cliente(client, observacoes="Nota antiga").json()["id"]

        resposta = client.put(f"/api/clientes/{cliente_id}", json={"nome": "Maria Souza"})

        assert resposta.status_code == 200
        dados = resposta.json()
        assert dados["nome"] == "Maria Souza"
        assert dados["telefone"] == "(41) 99999-0001"
        assert dados["observacoes"] == "Nota antiga"

    def test_cliente_inexistente_retorna_404(self, client):
        resposta = client.put("/api/clientes/999", json={"nome": "X"})
        assert resposta.status_code == 404


class TestExcluirCliente:
    def test_exclui_e_retorna_204(self, client):
        cliente_id = _criar_cliente(client).json()["id"]

        resposta = client.delete(f"/api/clientes/{cliente_id}")

        assert resposta.status_code == 204
        assert client.get(f"/api/clientes/{cliente_id}").status_code == 404

    def test_cliente_inexistente_retorna_404(self, client):
        assert client.delete("/api/clientes/999").status_code == 404

    def test_cliente_com_encomenda_retorna_409(self, client, db):
        cliente_id = _criar_cliente(client).json()["id"]
        _criar_encomenda_direto_no_banco(db, cliente_id)

        resposta = client.delete(f"/api/clientes/{cliente_id}")

        assert resposta.status_code == 409
