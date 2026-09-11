import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { servidor } from '../test/servidor'
import { api } from './api'

const BASE = 'http://localhost:8000/api'

describe('api de clientes', () => {
  it('listarClientes retorna o array da API', async () => {
    servidor.use(
      http.get(`${BASE}/clientes`, () =>
        HttpResponse.json([{ id: 1, nome: 'Maria', telefone: '419', observacoes: null }]),
      ),
    )

    const clientes = await api.listarClientes()

    expect(clientes).toHaveLength(1)
    expect(clientes[0].nome).toBe('Maria')
  })

  it('criarCliente envia POST com corpo JSON', async () => {
    let corpoRecebido
    servidor.use(
      http.post(`${BASE}/clientes`, async ({ request }) => {
        corpoRecebido = await request.json()
        return HttpResponse.json({ id: 7, ...corpoRecebido }, { status: 201 })
      }),
    )

    const criado = await api.criarCliente({ nome: 'Maria', telefone: '419' })

    expect(corpoRecebido).toEqual({ nome: 'Maria', telefone: '419' })
    expect(criado.id).toBe(7)
  })

  it('excluirCliente retorna null diante de 204', async () => {
    servidor.use(http.delete(`${BASE}/clientes/3`, () => new HttpResponse(null, { status: 204 })))

    await expect(api.excluirCliente(3)).resolves.toBeNull()
  })
})

describe('tratamento de erros', () => {
  it('lança Error com o detail retornado pela API', async () => {
    servidor.use(
      http.get(`${BASE}/clientes/999`, () =>
        HttpResponse.json({ detail: 'Cliente não encontrado' }, { status: 404 }),
      ),
    )

    await expect(api.obterCliente(999)).rejects.toThrow('Cliente não encontrado')
  })

  it('consolida mensagens de validação 422', async () => {
    servidor.use(
      http.post(`${BASE}/encomendas`, () =>
        HttpResponse.json(
          { detail: [{ msg: 'Field required' }, { msg: 'valor inválido' }] },
          { status: 422 },
        ),
      ),
    )

    await expect(api.criarEncomenda({})).rejects.toThrow('valor inválido')
  })
})

describe('api de encomendas e kanban', () => {
  it('listarEncomendas converte filtros para query string', async () => {
    let urlRecebida
    servidor.use(
      http.get(`${BASE}/encomendas`, ({ request }) => {
        urlRecebida = request.url
        return HttpResponse.json([])
      }),
    )

    await api.listarEncomendas({ statusId: 2, clienteId: 5 })

    expect(urlRecebida).toContain('status_id=2')
    expect(urlRecebida).toContain('cliente_id=5')
  })

  it('moverEncomenda envia PATCH com status_id', async () => {
    let corpoRecebido
    let metodo
    servidor.use(
      http.patch(`${BASE}/encomendas/9/status`, async ({ request }) => {
        metodo = request.method
        corpoRecebido = await request.json()
        return HttpResponse.json({ id: 9 })
      }),
    )

    await api.moverEncomenda(9, 4)

    expect(metodo).toBe('PATCH')
    expect(corpoRecebido).toEqual({ status_id: 4 })
  })

  it('obterKanban retorna as colunas do painel', async () => {
    servidor.use(
      http.get(`${BASE}/kanban`, () =>
        HttpResponse.json([{ status: { id: 1, nome: 'Orçado' }, encomendas: [] }]),
      ),
    )

    const colunas = await api.obterKanban()

    expect(colunas[0].status.nome).toBe('Orçado')
  })
})

describe('api de tipos de produto', () => {
  it('listarTiposProduto envia apenas_ativos quando solicitado', async () => {
    let urlRecebida
    servidor.use(
      http.get(`${BASE}/tipos-produto`, ({ request }) => {
        urlRecebida = request.url
        return HttpResponse.json([])
      }),
    )

    await api.listarTiposProduto(true)

    expect(urlRecebida).toContain('apenas_ativos=true')
  })
})


describe('URL base relativa (deploy atrás de proxy nginx)', () => {
  it('resolve caminhos relativos contra a origem da página', async () => {
    vi.stubEnv('VITE_API_URL', '/api')
    vi.resetModules()
    const { api: apiRelativa } = await import('./api')

    const origem = window.location.origin
    let urlRecebida
    servidor.use(
      http.get(`${origem}/api/clientes`, ({ request }) => {
        urlRecebida = request.url
        return HttpResponse.json([{ id: 1, nome: 'Maria' }])
      }),
    )

    const clientes = await apiRelativa.listarClientes()

    expect(urlRecebida).toBe(`${origem}/api/clientes`)
    expect(clientes).toHaveLength(1)

    vi.unstubAllEnvs()
    vi.resetModules()
  })
})

