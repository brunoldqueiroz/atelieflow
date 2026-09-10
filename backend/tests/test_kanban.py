"""RF05 — Painel Kanban ordenado pelas entregas mais urgentes."""


def _criar_base(client):
    cliente_id = (
        client.post("/api/clientes", json={"nome": "Maria", "telefone": "41999990001"})
        .json()["id"]
    )
    tipo_id = client.post("/api/tipos-produto", json={"nome": "Agenda"}).json()["id"]
    return cliente_id, tipo_id


def _criar_status(client, nome, ordem, cor="slate"):
    return client.post(
        "/api/status-encomenda", json={"nome": nome, "ordem": ordem, "cor_badge": cor}
    ).json()["id"]


def _criar_encomenda(client, cliente_id, tipo_id, status_id, data_entrega):
    return client.post(
        "/api/encomendas",
        json={
            "cliente_id": cliente_id,
            "tipo_produto_id": tipo_id,
            "status_id": status_id,
            "detalhes_personalizacao": "Capa floral com espiral rose",
            "data_entrega_prevista": data_entrega,
            "valor_total": "90.00",
        },
    )


class TestKanban:
    def test_retorna_colunas_ordenadas_pela_sequencia_inclusive_vazias(self, client):
        cliente_id, tipo_id = _criar_base(client)
        _criar_status(client, "Pronto", 4, "emerald")
        orcado_id = _criar_status(client, "Orçado", 1, "slate")
        _criar_status(client, "Em Produção", 3, "blue")
        _criar_encomenda(client, cliente_id, tipo_id, orcado_id, "2026-10-01")

        resposta = client.get("/api/kanban")

        assert resposta.status_code == 200
        colunas = resposta.json()
        assert [c["status"]["nome"] for c in colunas] == [
            "Orçado",
            "Em Produção",
            "Pronto",
        ]
        assert len(colunas[0]["encomendas"]) == 1
        assert colunas[1]["encomendas"] == []
        assert colunas[2]["encomendas"] == []

    def test_cards_ordenados_por_entrega_mais_urgente(self, client):
        cliente_id, tipo_id = _criar_base(client)
        status_id = _criar_status(client, "Orçado", 1)
        _criar_encomenda(client, cliente_id, tipo_id, status_id, "2026-12-01")
        _criar_encomenda(client, cliente_id, tipo_id, status_id, "2026-09-15")
        _criar_encomenda(client, cliente_id, tipo_id, status_id, "2026-10-20")

        resposta = client.get("/api/kanban")

        cards = resposta.json()[0]["encomendas"]
        assert [c["data_entrega_prevista"] for c in cards] == [
            "2026-09-15",
            "2026-10-20",
            "2026-12-01",
        ]

    def test_card_traz_dados_necessarios_ao_painel(self, client):
        cliente_id, tipo_id = _criar_base(client)
        status_id = _criar_status(client, "Orçado", 1, cor="slate")
        _criar_encomenda(client, cliente_id, tipo_id, status_id, "2026-10-01")

        resposta = client.get("/api/kanban")

        coluna = resposta.json()[0]
        assert coluna["status"]["cor_badge"] == "slate"
        card = coluna["encomendas"][0]
        assert card["cliente"]["nome"] == "Maria"
        assert card["tipo_produto"]["nome"] == "Agenda"
        assert card["detalhes_personalizacao"].startswith("Capa floral")
        assert float(card["valor_total"]) == 90.00
        assert "valor_sinal" in card
