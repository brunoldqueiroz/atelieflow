"""RF02 — Manutenção paramétrica de tipos de produto."""

from datetime import date
from decimal import Decimal

from app import models


def _criar_tipo(client, **sobreescrito):
    dados = {"nome": "Caderno"}
    dados.update(sobreescrito)
    return client.post("/api/tipos-produto", json=dados)


def _vincular_encomenda(db, tipo_id):
    cliente = models.Cliente(nome="Maria", telefone="41999990001")
    status = models.StatusEncomenda(nome="Orçado", ordem=1)
    db.add_all([cliente, status])
    db.flush()
    db.add(
        models.Encomenda(
            cliente_id=cliente.id,
            tipo_produto_id=tipo_id,
            status_id=status.id,
            detalhes_personalizacao="Capa azul",
            data_entrega_prevista=date(2026, 10, 1),
            valor_total=Decimal("80.00"),
        )
    )
    db.commit()


class TestCriarTipoProduto:
    def test_retorna_201_com_ativo_padrao_verdadeiro(self, client):
        resposta = _criar_tipo(client)

        assert resposta.status_code == 201
        dados = resposta.json()
        assert dados["id"] > 0
        assert dados["nome"] == "Caderno"
        assert dados["ativo"] is True

    def test_nome_duplicado_retorna_409(self, client):
        _criar_tipo(client)

        resposta = _criar_tipo(client)

        assert resposta.status_code == 409

    def test_sem_nome_retorna_422(self, client):
        assert client.post("/api/tipos-produto", json={}).status_code == 422

    def test_nome_acima_de_60_caracteres_retorna_422(self, client):
        assert _criar_tipo(client, nome="C" * 61).status_code == 422


class TestListarTiposProduto:
    def test_lista_todos(self, client):
        _criar_tipo(client, nome="Caderno")
        _criar_tipo(client, nome="Agenda", ativo=False)

        resposta = client.get("/api/tipos-produto")

        assert resposta.status_code == 200
        assert len(resposta.json()) == 2

    def test_filtro_apenas_ativos(self, client):
        _criar_tipo(client, nome="Caderno")
        _criar_tipo(client, nome="Agenda", ativo=False)

        resposta = client.get("/api/tipos-produto", params={"apenas_ativos": True})

        assert [t["nome"] for t in resposta.json()] == ["Caderno"]


class TestAtualizarTipoProduto:
    def test_atualiza_nome_e_desativa(self, client):
        tipo_id = _criar_tipo(client).json()["id"]

        resposta = client.put(
            f"/api/tipos-produto/{tipo_id}", json={"nome": "Caderno Universitário", "ativo": False}
        )

        assert resposta.status_code == 200
        assert resposta.json()["nome"] == "Caderno Universitário"
        assert resposta.json()["ativo"] is False

    def test_nome_duplicado_na_atualizacao_retorna_409(self, client):
        _criar_tipo(client, nome="Agenda")
        tipo_id = _criar_tipo(client, nome="Caderno").json()["id"]

        resposta = client.put(f"/api/tipos-produto/{tipo_id}", json={"nome": "Agenda"})

        assert resposta.status_code == 409

    def test_inexistente_retorna_404(self, client):
        assert client.put("/api/tipos-produto/999", json={"nome": "X"}).status_code == 404


class TestExcluirTipoProduto:
    def test_exclui_sem_vinculos_e_retorna_204(self, client):
        tipo_id = _criar_tipo(client).json()["id"]

        resposta = client.delete(f"/api/tipos-produto/{tipo_id}")

        assert resposta.status_code == 204
        assert client.get("/api/tipos-produto").json() == []

    def test_com_encomenda_vinculada_retorna_409(self, client, db):
        tipo_id = _criar_tipo(client).json()["id"]
        _vincular_encomenda(db, tipo_id)

        resposta = client.delete(f"/api/tipos-produto/{tipo_id}")

        assert resposta.status_code == 409

    def test_inexistente_retorna_404(self, client):
        assert client.delete("/api/tipos-produto/999").status_code == 404
