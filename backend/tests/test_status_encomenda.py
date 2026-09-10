"""RF03 — Configuração sequencial das etapas do pipeline de confecção."""

from datetime import date
from decimal import Decimal

from app import models


def _criar_status(client, **sobreescrito):
    dados = {"nome": "Orçado", "ordem": 1, "cor_badge": "slate"}
    dados.update(sobreescrito)
    return client.post("/api/status-encomenda", json=dados)


def _vincular_encomenda(db, status_id):
    cliente = models.Cliente(nome="Maria", telefone="41999990001")
    tipo = models.TipoProduto(nome="Caderno", ativo=True)
    db.add_all([cliente, tipo])
    db.flush()
    db.add(
        models.Encomenda(
            cliente_id=cliente.id,
            tipo_produto_id=tipo.id,
            status_id=status_id,
            detalhes_personalizacao="Capa azul",
            data_entrega_prevista=date(2026, 10, 1),
            valor_total=Decimal("80.00"),
        )
    )
    db.commit()


class TestListarStatus:
    def test_retorna_ordenado_pela_sequencia_do_kanban(self, client):
        _criar_status(client, nome="Pronto", ordem=4, cor_badge="emerald")
        _criar_status(client, nome="Orçado", ordem=1, cor_badge="slate")
        _criar_status(client, nome="Em Produção", ordem=3, cor_badge="blue")

        resposta = client.get("/api/status-encomenda")

        assert resposta.status_code == 200
        assert [s["nome"] for s in resposta.json()] == ["Orçado", "Em Produção", "Pronto"]


class TestCriarStatus:
    def test_retorna_201_e_dados(self, client):
        resposta = _criar_status(client)

        assert resposta.status_code == 201
        dados = resposta.json()
        assert dados["id"] > 0
        assert dados["nome"] == "Orçado"
        assert dados["ordem"] == 1
        assert dados["cor_badge"] == "slate"

    def test_cor_badge_e_opcional(self, client):
        resposta = client.post("/api/status-encomenda", json={"nome": "Orçado", "ordem": 1})

        assert resposta.status_code == 201
        assert resposta.json()["cor_badge"] is None

    def test_nome_duplicado_retorna_409(self, client):
        _criar_status(client)

        assert _criar_status(client).status_code == 409

    def test_ordem_menor_que_um_retorna_422(self, client):
        assert _criar_status(client, ordem=0).status_code == 422


class TestAtualizarStatus:
    def test_atualiza_ordem_e_cor(self, client):
        status_id = _criar_status(client).json()["id"]

        resposta = client.put(
            f"/api/status-encomenda/{status_id}", json={"ordem": 2, "cor_badge": "amber"}
        )

        assert resposta.status_code == 200
        assert resposta.json()["ordem"] == 2
        assert resposta.json()["cor_badge"] == "amber"
        assert resposta.json()["nome"] == "Orçado"

    def test_inexistente_retorna_404(self, client):
        assert client.put("/api/status-encomenda/999", json={"ordem": 2}).status_code == 404


class TestExcluirStatus:
    def test_exclui_sem_vinculos_e_retorna_204(self, client):
        status_id = _criar_status(client).json()["id"]

        resposta = client.delete(f"/api/status-encomenda/{status_id}")

        assert resposta.status_code == 204

    def test_com_encomenda_vinculada_retorna_409(self, client, db):
        status_id = _criar_status(client).json()["id"]
        _vincular_encomenda(db, status_id)

        assert client.delete(f"/api/status-encomenda/{status_id}").status_code == 409

    def test_inexistente_retorna_404(self, client):
        assert client.delete("/api/status-encomenda/999").status_code == 404
