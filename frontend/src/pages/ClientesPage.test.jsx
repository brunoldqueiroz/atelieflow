import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { servidor } from '../test/servidor'
import ClientesPage from './ClientesPage'

const BASE = 'http://localhost:8000/api'

const MARIA = { id: 1, nome: 'Maria Silva', telefone: '(41) 99999-0001', observacoes: 'Prefere laminação fosca' }
const ANA = { id: 2, nome: 'Ana Souza', telefone: '(41) 98888-0002', observacoes: null }

function mockLista(clientes = [MARIA, ANA]) {
  servidor.use(http.get(`${BASE}/clientes`, () => HttpResponse.json(clientes)))
}

function renderPagina() {
  return render(
    <MemoryRouter>
      <ClientesPage />
    </MemoryRouter>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('ClientesPage — listagem', () => {
  it('lista clientes com nome, telefone e observações', async () => {
    mockLista()
    renderPagina()

    expect(await screen.findByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('(41) 99999-0001')).toBeInTheDocument()
    expect(screen.getByText('Prefere laminação fosca')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
  })

  it('mostra alerta quando o carregamento falha', async () => {
    servidor.use(
      http.get(`${BASE}/clientes`, () =>
        HttpResponse.json({ detail: 'Falha de rede' }, { status: 500 }),
      ),
    )
    renderPagina()

    expect(await screen.findByRole('alert')).toHaveTextContent(/Falha de rede/)
  })
})

describe('ClientesPage — criar e editar', () => {
  it('cria cliente pelo formulário', async () => {
    mockLista([MARIA])
    let corpoPost
    servidor.use(
      http.post(`${BASE}/clientes`, async ({ request }) => {
        corpoPost = await request.json()
        return HttpResponse.json({ id: 3, ...corpoPost }, { status: 201 })
      }),
    )
    renderPagina()
    await screen.findByText('Maria Silva')

    await userEvent.click(screen.getByRole('button', { name: 'Novo cliente' }))
    await userEvent.type(screen.getByLabelText('Nome'), 'Joana Lima')
    await userEvent.type(screen.getByLabelText('Telefone/WhatsApp'), '(41) 97777-0003')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(corpoPost).toEqual({ nome: 'Joana Lima', telefone: '(41) 97777-0003', observacoes: null })
    expect(await screen.findByText('Joana Lima')).toBeInTheDocument()
  })

  it('edita cliente existente', async () => {
    mockLista([MARIA])
    let corpoPut
    servidor.use(
      http.put(`${BASE}/clientes/1`, async ({ request }) => {
        corpoPut = await request.json()
        return HttpResponse.json({ ...MARIA, ...corpoPut })
      }),
    )
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Editar/ }))

    expect(screen.getByLabelText('Nome')).toHaveValue('Maria Silva')
    await userEvent.clear(screen.getByLabelText('Nome'))
    await userEvent.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(corpoPut).toMatchObject({ nome: 'Maria Souza' })
    expect(await screen.findByText('Maria Souza')).toBeInTheDocument()
  })
})



describe('ClientesPage — excluir', () => {
  it('exclui cliente após confirmação', async () => {
    mockLista([MARIA])
    servidor.use(http.delete(`${BASE}/clientes/1`, () => new HttpResponse(null, { status: 204 })))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
  })

  it('exibe erro da API ao excluir cliente com encomendas', async () => {
    mockLista([MARIA])
    servidor.use(
      http.delete(`${BASE}/clientes/1`, () =>
        HttpResponse.json(
          { detail: 'Cliente possui encomendas vinculadas e não pode ser excluído' },
          { status: 409 },
        ),
      ),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/encomendas vinculadas/)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  })
})

describe('ClientesPage — histórico', () => {
  const detalheMaria = {
    ...MARIA,
    encomendas: [
      {
        id: 10,
        detalhes_personalizacao: 'Capa rosa',
        data_entrega_prevista: '2026-10-01',
        valor_total: '150.00',
        valor_sinal: '50.00',
        cliente: MARIA,
        tipo_produto: { id: 1, nome: 'Caderno', ativo: true },
        status: { id: 4, nome: 'Pronto', ordem: 4, cor_badge: 'emerald' },
      },
    ],
  }

  it('expande a linha e carrega o histórico de encomendas', async () => {
    mockLista([MARIA])
    servidor.use(http.get(`${BASE}/clientes/1`, () => HttpResponse.json(detalheMaria)))
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Histórico/ }))

    expect(await screen.findByText(/Caderno/)).toBeInTheDocument()
    expect(screen.getByText('Entrega: 01/10/2026')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 150,00/)).toBeInTheDocument()
    expect(screen.getByText('Pronto')).toBeInTheDocument()
  })

  it('informa quando o cliente não tem encomendas', async () => {
    mockLista([MARIA])
    servidor.use(
      http.get(`${BASE}/clientes/1`, () => HttpResponse.json({ ...MARIA, encomendas: [] })),
    )
    renderPagina()
    await screen.findByText('Maria Silva')

    const linha = screen.getByText('Maria Silva').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Histórico/ }))

    expect(await screen.findByText(/Nenhuma encomenda registrada para este cliente/)).toBeInTheDocument()
  })
})
