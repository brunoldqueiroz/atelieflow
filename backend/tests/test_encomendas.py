"""RF04 — Registro e orçamentação de encomendas."""

from datetime import datetime


def _ids_base(client):
    cliente_id = (
        client.post("/api/clientes", json={"nome": "Maria", "telefone": "41999990001"})
        .json()["id"]
    )
    tipo_id = client.post("/api/tipos-produto", json={"nome": "Caderno"}).json()["id"]
    status_id = (
        client.post("/api/status-encomenda", json={"nome": "Orçado", "ordem": 1})
        .json()["id"]
    )
    return cliente_id, tipo_id, status_id


def _payload(cliente_id, tipo_id, status_id, **sobreescrito):
    dados = {
        "cliente_id": cliente_id,
        "tipo_produto_id": tipo_id,
        "status_id": status_id,
        "detalhes_personalizacao": "Capa rosa, nome 'Maria' em dourado, miolo pautado",
        "data_entrega_prevista": "2026-10-01",
        "valor_total": "150.00",
        "valor_sinal": "50.00",
    }
    dados.update(sobreescrito)
    return dados


def _criar_encomenda(client, cliente_id, tipo_id, status_id, **sobreescrito):
    return client.post(
        "/api/encomendas", json=_payload(cliente_id, tipo_id, status_id, **sobreescrito)
    )


class TestCriarEncomenda:
    def test_retorna_201_com_dados_e_data_pedido_automatica(self, client):
        ids = _ids_base(client)

        resposta = _criar_encomenda(client, *ids, observacoes_internas="Cliente apressado")

        assert resposta.status_code == 201
        dados = resposta.json()
        assert dados["id"] > 0
        assert dados["detalhes_personalizacao"].startswith("Capa rosa")
        assert dados["data_entrega_prevista"] == "2026-10-01"
        assert float(dados["valor_total"]) == 150.00
        assert float(dados["valor_sinal"]) == 50.00
        assert dados["observacoes_internas"] == "Cliente apressado"
        datetime.fromisoformat(dados["data_pedido"])  # preenchida automaticamente

    def test_valor_sinal_padrao_zero(self, client):
        ids = _ids_base(client)
        dados = _payload(*ids)
        del dados["valor_sinal"]

        resposta = client.post("/api/encomendas", json=dados)

        assert resposta.status_code == 201
        assert float(resposta.json()["valor_sinal"]) == 0.00

    def test_sinal_maior_que_total_retorna_422(self, client):
        ids = _ids_base(client)

        resposta = _criar_encomenda(client, *ids, valor_sinal="200.00")

        assert resposta.status_code == 422

    def test_valor_total_negativo_retorna_422(self, client):
        ids = _ids_base(client)
        assert _criar_encomenda(client, *ids, valor_total="-10.00").status_code == 422

    def test_sem_detalhes_personalizacao_retorna_422(self, client):
        ids = _ids_base(client)
        assert _criar_encomenda(client, *ids, detalhes_personalizacao="").status_code == 422

    def test_cliente_inexistente_retorna_404(self, client):
        _, tipo_id, status_id = _ids_base(client)

        resposta = _criar_encomenda(client, 999, tipo_id, status_id)

        assert resposta.status_code == 404
        assert "Cliente" in resposta.json()["detail"]

    def test_tipo_produto_inexistente_retorna_404(self, client):
        cliente_id, _, status_id = _ids_base(client)
        assert _criar_encomenda(client, cliente_id, 999, status_id).status_code == 404

    def test_tipo_produto_inativo_retorna_400(self, client):
        cliente_id, tipo_id, status_id = _ids_base(client)
        client.put(f"/api/tipos-produto/{tipo_id}", json={"ativo": False})

        resposta = _criar_encomenda(client, cliente_id, tipo_id, status_id)

        assert resposta.status_code == 400

    def test_status_inexistente_retorna_404(self, client):
        cliente_id, tipo_id, _ = _ids_base(client)
        assert _criar_encomenda(client, cliente_id, tipo_id, 999).status_code == 404


class TestListarEncomendas:
    def test_retorna_ordenado_por_entrega_mais_urgente(self, client):
        ids = _ids_base(client)
        _criar_encomenda(client, *ids, data_entrega_prevista="2026-12-01")
        _criar_encomenda(client, *ids, data_entrega_prevista="2026-09-20")

        resposta = client.get("/api/encomendas")

        assert resposta.status_code == 200
        datas = [e["data_entrega_prevista"] for e in resposta.json()]
        assert datas == ["2026-09-20", "2026-12-01"]

    def test_filtra_por_status(self, client):
        cliente_id, tipo_id, status_id = _ids_base(client)
        outro_status = (
            client.post("/api/status-encomenda", json={"nome": "Pronto", "ordem": 4})
            .json()["id"]
        )
        _criar_encomenda(client, cliente_id, tipo_id, status_id)
        _criar_encomenda(client, cliente_id, tipo_id, outro_status)

        resposta = client.get("/api/encomendas", params={"status_id": status_id})

        assert len(resposta.json()) == 1
        assert resposta.json()[0]["status"]["id"] == status_id

    def test_filtra_por_cliente(self, client):
        cliente_id, tipo_id, status_id = _ids_base(client)
        outro_cliente = (
            client.post("/api/clientes", json={"nome": "Joana", "telefone": "41988880002"})
            .json()["id"]
        )
        _criar_encomenda(client, cliente_id, tipo_id, status_id)
        _criar_encomenda(client, outro_cliente, tipo_id, status_id)

        resposta = client.get("/api/encomendas", params={"cliente_id": outro_cliente})

        assert len(resposta.json()) == 1
        assert resposta.json()[0]["cliente"]["nome"] == "Joana"



class TestObterEncomenda:
    def test_retorna_com_cliente_tipo_e_status_aninhados(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.get(f"/api/encomendas/{encomenda_id}")

        assert resposta.status_code == 200
        dados = resposta.json()
        assert dados["cliente"]["nome"] == "Maria"
        assert dados["tipo_produto"]["nome"] == "Caderno"
        assert dados["status"]["nome"] == "Orçado"

    def test_inexistente_retorna_404(self, client):
        assert client.get("/api/encomendas/999").status_code == 404


class TestAtualizarEncomenda:
    def test_atualiza_prazo_e_valores(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.put(
            f"/api/encomendas/{encomenda_id}",
            json={"data_entrega_prevista": "2026-10-15", "valor_sinal": "100.00"},
        )

        assert resposta.status_code == 200
        dados = resposta.json()
        assert dados["data_entrega_prevista"] == "2026-10-15"
        assert float(dados["valor_sinal"]) == 100.00
        assert float(dados["valor_total"]) == 150.00

    def test_sinal_maior_que_total_existente_retorna_422(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.put(
            f"/api/encomendas/{encomenda_id}", json={"valor_sinal": "999.00"}
        )

        assert resposta.status_code == 422

    def test_fk_inexistente_na_atualizacao_retorna_404(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.put(f"/api/encomendas/{encomenda_id}", json={"cliente_id": 999})

        assert resposta.status_code == 404

    def test_inexistente_retorna_404(self, client):
        resposta = client.put("/api/encomendas/999", json={"valor_sinal": "10.00"})
        assert resposta.status_code == 404


class TestMoverStatusEncomenda:
    def test_patch_atualiza_status(self, client):
        cliente_id, tipo_id, status_id = _ids_base(client)
        novo_status = (
            client.post("/api/status-encomenda", json={"nome": "Em Produção", "ordem": 3})
            .json()["id"]
        )
        encomenda_id = _criar_encomenda(client, cliente_id, tipo_id, status_id).json()["id"]

        resposta = client.patch(
            f"/api/encomendas/{encomenda_id}/status", json={"status_id": novo_status}
        )

        assert resposta.status_code == 200
        assert resposta.json()["status"]["nome"] == "Em Produção"

    def test_status_inexistente_retorna_404(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.patch(
            f"/api/encomendas/{encomenda_id}/status", json={"status_id": 999}
        )

        assert resposta.status_code == 404

    def test_encomenda_inexistente_retorna_404(self, client):
        resposta = client.patch("/api/encomendas/999/status", json={"status_id": 1})
        assert resposta.status_code == 404


class TestExcluirEncomenda:
    def test_exclui_e_retorna_204(self, client):
        ids = _ids_base(client)
        encomenda_id = _criar_encomenda(client, *ids).json()["id"]

        resposta = client.delete(f"/api/encomendas/{encomenda_id}")

        assert resposta.status_code == 204
        assert client.get(f"/api/encomendas/{encomenda_id}").status_code == 404

    def test_inexistente_retorna_404(self, client):
        assert client.delete("/api/encomendas/999").status_code == 404
