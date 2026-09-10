import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { servidor } from '../test/servidor'
import KanbanPage, { aplicarMovimento } from './KanbanPage'

const BASE = 'http://localhost:8000/api'

const STATUS_ORCADO = { id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' }
const STATUS_ARTE = { id: 2, nome: 'Aguardando Arte', ordem: 2, cor_badge: 'amber' }

function encomenda(id, nomeCliente, status, dataEntrega = '2099-12-01') {
  return {
    id,
    detalhes_personalizacao: 'Capa dura floral',
    data_entrega_prevista: dataEntrega,
    valor_total: '90.00',
    valor_sinal: '0.00',
    cliente: { id, nome: nomeCliente, telefone: '419' },
    tipo_produto: { id: 1, nome: 'Agenda', ativo: true },
    status,
  }
}

function colunasKanban() {
  return [
    { status: STATUS_ORCADO, encomendas: [encomenda(10, 'Maria Silva', STATUS_ORCADO)] },
    { status: STATUS_ARTE, encomendas: [] },
  ]
}

function mockKanban(colunas = colunasKanban()) {
  servidor.use(http.get(`${BASE}/kanban`, () => HttpResponse.json(colunas)))
}

describe('KanbanPage', () => {
  it('carrega e exibe colunas e cards da API', async () => {
    mockKanban()
    render(<KanbanPage />)

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Orçado')).toBeInTheDocument()
    expect(screen.getByText('Aguardando Arte')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente quando a API falha', async () => {
    servidor.use(
      http.get(`${BASE}/kanban`, () =>
        HttpResponse.json({ detail: 'Erro interno' }, { status: 500 }),
      ),
    )
    render(<KanbanPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Erro interno/)

    mockKanban()
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
  })

  it('move o card otimisticamente e confirma via PATCH', async () => {
    let corpoPatch
    mockKanban()
    servidor.use(
      http.patch(`${BASE}/encomendas/10/status`, async ({ request }) => {
        corpoPatch = await request.json()
        return HttpResponse.json({})
      }),
    )
    render(<KanbanPage />)
    await screen.findByText('Maria Silva')

    const colunaOrcado = screen.getByLabelText('Coluna Orçado')
    await userEvent.click(colunaOrcado.querySelector('[aria-label="Avançar status"]'))

    expect(corpoPatch).toEqual({ status_id: 2 })
    const colunaArte = screen.getByLabelText('Coluna Aguardando Arte')
    expect(within(colunaArte).getByText('Maria Silva')).toBeInTheDocument()
  })

  it('reverte o movimento e mostra erro quando o PATCH falha', async () => {
    mockKanban()
    servidor.use(
      http.patch(`${BASE}/encomendas/10/status`, () =>
        HttpResponse.json({ detail: 'Falha ao salvar' }, { status: 500 }),
      ),
    )
    render(<KanbanPage />)
    await screen.findByText('Maria Silva')

    const colunaOrcado = screen.getByLabelText('Coluna Orçado')
    await userEvent.click(colunaOrcado.querySelector('[aria-label="Avançar status"]'))

    await waitFor(() => {
      const coluna = screen.getByLabelText('Coluna Orçado')
      expect(within(coluna).getByText('Maria Silva')).toBeInTheDocument()
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/Falha ao salvar/)
  })

  it('informa quando não há status configurados', async () => {
    mockKanban([])
    render(<KanbanPage />)

    expect(await screen.findByText(/Nenhum status configurado/)).toBeInTheDocument()
  })
})

describe('aplicarMovimento', () => {
  it('move o card para a coluna de destino', () => {
    const colunas = colunasKanban()

    const resultado = aplicarMovimento(colunas, 10, 2)

    expect(resultado[0].encomendas).toHaveLength(0)
    expect(resultado[1].encomendas).toHaveLength(1)
    expect(resultado[1].encomendas[0].status.nome).toBe('Aguardando Arte')
  })

  it('mantém a ordenação por entrega mais urgente na coluna de destino', () => {
    const colunas = [
      { status: STATUS_ORCADO, encomendas: [encomenda(10, 'Maria', STATUS_ORCADO, '2099-12-01')] },
      {
        status: STATUS_ARTE,
        encomendas: [
          encomenda(20, 'Ana', STATUS_ARTE, '2099-11-01'),
          encomenda(30, 'Joana', STATUS_ARTE, '2099-12-15'),
        ],
      },
    ]

    const resultado = aplicarMovimento(colunas, 10, 2)

    expect(resultado[1].encomendas.map((e) => e.id)).toEqual([20, 10, 30])
  })

  it('retorna as colunas intactas para id desconhecido', () => {
    const colunas = colunasKanban()

    expect(aplicarMovimento(colunas, 999, 2)).toBe(colunas)
  })
})
