def test_health_retorna_status_ok(client):
    resposta = client.get("/api/health")

    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}
