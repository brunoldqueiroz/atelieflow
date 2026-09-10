import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { servidor } from '../test/servidor'
import EncomendasPage from './EncomendasPage'

const BASE = 'http://localhost:8000/api'

function encomenda(id, nomeCliente, statusNome, cor = 'slate') {
  return {
    id,
    cliente_id: id,
    tipo_produto_id: 1,
    status_id: 1,
    detalhes_personalizacao: "Capa rosa, nome em dourado",
    data_pedido: '2026-09-01T10:00:00',
    data_entrega_prevista: '2026-10-01',
    valor_total: '150.00',
    valor_sinal: '50.00',
    observacoes_internas: null,
    cliente: { id, nome: nomeCliente, telefone: '419', observacoes: null },
    tipo_produto: { id: 1, nome: 'Caderno', ativo: true },
    status: { id: 1, nome: statusNome, ordem: 1, cor_badge: cor },
  }
}

function mockLista(encomendas) {
  servidor.use(http.get(`${BASE}/encomendas`, () => HttpResponse.json(encomendas)))
}

function renderPagina() {
  return render(
    <MemoryRouter>
      <EncomendasPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EncomendasPage', () => {
  it('lista encomendas com cliente, produto, entrega, valor e status', async () => {
    mockLista([encomenda(1, 'Maria Silva', 'Orçado'), encomenda(2, 'Ana Souza', 'Pronto', 'emerald')])
    renderPagina()

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getAllByText('Caderno')).toHaveLength(2)
    expect(screen.getByText('Entrega: 01/10/2026')).toBeInTheDocument()
    expect(screen.getAllByText(/R\$ 150,00/).length).toBeGreaterThan(0)
    expect(screen.getByText('Orçado')).toBeInTheDocument()
    expect(screen.getByText('Pronto')).toBeInTheDocument()
  })

  it('exibe estado vazio com convite ao cadastro', async () => {
    mockLista([])
    renderPagina()

    expect(await screen.findByText(/Nenhuma encomenda registrada/)).toBeInTheDocument()
  })

  it('exclui encomenda após confirmação', async () => {
    mockLista([encomenda(1, 'Maria Silva', 'Orçado')])
    let excluiu = false
    servidor.use(
      http.delete(`${BASE}/encomendas/1`, () => {
        excluiu = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(excluiu).toBe(true)
    expect(await screen.findByText(/Nenhuma encomenda registrada/)).toBeInTheDocument()
  })

  it('não exclui quando a confirmação é cancelada', async () => {
    mockLista([encomenda(1, 'Maria Silva', 'Orçado')])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  })

  it('mostra alerta quando o carregamento falha', async () => {
    servidor.use(
      http.get(`${BASE}/encomendas`, () =>
        HttpResponse.json({ detail: 'Sem conexão' }, { status: 500 }),
      ),
    )
    renderPagina()

    expect(await screen.findByRole('alert')).toHaveTextContent(/Sem conexão/)
  })
})
