from app import models
from app.seed import seed_database


def test_seed_cria_tipos_de_produto_conforme_rf02(db):
    seed_database(db)

    tipos = db.query(models.TipoProduto).all()

    assert {t.nome for t in tipos} == {
        "Caderno",
        "Agenda",
        "Caderneta de Vacina",
        "Bloco de Notas",
    }
    assert all(t.ativo for t in tipos)


def test_seed_cria_cinco_status_sequenciais_conforme_rf03(db):
    seed_database(db)

    status = db.query(models.StatusEncomenda).order_by(models.StatusEncomenda.ordem).all()

    assert [s.nome for s in status] == [
        "Orçado",
        "Aguardando Arte",
        "Em Produção",
        "Pronto",
        "Entregue",
    ]
    assert [s.ordem for s in status] == [1, 2, 3, 4, 5]
    assert all(s.cor_badge for s in status)


def test_seed_e_idempotente(db):
    seed_database(db)
    seed_database(db)

    assert db.query(models.TipoProduto).count() == 4
    assert db.query(models.StatusEncomenda).count() == 5
