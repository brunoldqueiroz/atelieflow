import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { servidor } from '../test/servidor'
import ConfigPage from './ConfigPage'

const BASE = 'http://localhost:8000/api'

const TIPOS = [
  { id: 1, nome: 'Caderno', ativo: true },
  { id: 2, nome: 'Agenda', ativo: false },
]

const STATUS = [
  { id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' },
  { id: 2, nome: 'Aguardando Arte', ordem: 2, cor_badge: 'amber' },
]

function mockTudo() {
  servidor.use(
    http.get(`${BASE}/tipos-produto`, () => HttpResponse.json(TIPOS)),
    http.get(`${BASE}/status-encomenda`, () => HttpResponse.json(STATUS)),
  )
}

afterEach(() => vi.restoreAllMocks())

describe('ConfigPage — tipos de produto (RF02)', () => {
  it('lista tipos com situação de ativo', async () => {
    mockTudo()
    render(<ConfigPage />)

    const secao = await screen.findByLabelText('Seção de tipos de produto')
    expect(within(secao).getByText('Caderno')).toBeInTheDocument()
    expect(within(secao).getByText('Agenda')).toBeInTheDocument()
    expect(within(secao).getByText('Ativo')).toBeInTheDocument()
    expect(within(secao).getByText('Inativo')).toBeInTheDocument()
  })

  it('adiciona novo tipo de produto', async () => {
    mockTudo()
    let corpoPost
    servidor.use(
      http.post(`${BASE}/tipos-produto`, async ({ request }) => {
        corpoPost = await request.json()
        return HttpResponse.json({ id: 3, ativo: true, ...corpoPost }, { status: 201 })
      }),
    )
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de tipos de produto')

    await userEvent.type(within(secao).getByLabelText('Nome do novo tipo'), 'Fichário')
    await userEvent.click(within(secao).getByRole('button', { name: 'Adicionar' }))

    expect(corpoPost).toEqual({ nome: 'Fichário', ativo: true })
    expect(await within(secao).findByText('Fichário')).toBeInTheDocument()
  })

  it('ativa e desativa tipo existente', async () => {
    mockTudo()
    let corpoPut
    servidor.use(
      http.put(`${BASE}/tipos-produto/2`, async ({ request }) => {
        corpoPut = await request.json()
        return HttpResponse.json({ id: 2, nome: 'Agenda', ativo: true })
      }),
    )
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de tipos de produto')

    const linha = within(secao).getByText('Agenda').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Ativar/ }))

    expect(corpoPut).toEqual({ ativo: true })
    expect(await within(linha).findByText('Ativo')).toBeInTheDocument()
  })

  it('exibe erro da API ao excluir tipo com encomendas', async () => {
    mockTudo()
    servidor.use(
      http.delete(`${BASE}/tipos-produto/1`, () =>
        HttpResponse.json(
          { detail: 'Tipo de produto possui encomendas vinculadas; desative-o em vez de excluir' },
          { status: 409 },
        ),
      ),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de tipos de produto')

    const linha = within(secao).getByText('Caderno').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/desative-o em vez de excluir/)
  })
})



describe('ConfigPage — status do pipeline (RF03)', () => {
  it('lista status na sequência com suas cores', async () => {
    mockTudo()
    render(<ConfigPage />)

    const secao = await screen.findByLabelText('Seção de status')
    const itens = within(secao).getAllByRole('row').slice(1)
    expect(itens[0]).toHaveTextContent('Orçado')
    expect(itens[1]).toHaveTextContent('Aguardando Arte')
  })

  it('adiciona novo status com ordem e cor', async () => {
    mockTudo()
    let corpoPost
    servidor.use(
      http.post(`${BASE}/status-encomenda`, async ({ request }) => {
        corpoPost = await request.json()
        return HttpResponse.json({ id: 3, ...corpoPost }, { status: 201 })
      }),
    )
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de status')

    await userEvent.type(within(secao).getByLabelText('Nome do novo status'), 'Em Produção')
    await userEvent.type(within(secao).getByLabelText('Ordem'), '3')
    await userEvent.selectOptions(within(secao).getByLabelText('Cor'), 'blue')
    await userEvent.click(within(secao).getByRole('button', { name: 'Adicionar' }))

    expect(corpoPost).toEqual({ nome: 'Em Produção', ordem: 3, cor_badge: 'blue' })
    expect(await within(secao).findByText('Em Produção')).toBeInTheDocument()
  })

  it('edita a cor de um status existente', async () => {
    mockTudo()
    let corpoPut
    servidor.use(
      http.put(`${BASE}/status-encomenda/1`, async ({ request }) => {
        corpoPut = await request.json()
        return HttpResponse.json({ id: 1, nome: 'Orçado', ordem: 1, cor_badge: corpoPut.cor_badge })
      }),
    )
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de status')

    const linha = within(secao).getByText('Orçado').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Editar/ }))
    await userEvent.selectOptions(within(linha).getByLabelText('Cor'), 'red')
    await userEvent.click(within(linha).getByRole('button', { name: 'Salvar' }))

    expect(corpoPut).toMatchObject({ cor_badge: 'red' })
  })

  it('exclui status sem vínculos', async () => {
    mockTudo()
    servidor.use(
      http.delete(`${BASE}/status-encomenda/1`, () => new HttpResponse(null, { status: 204 })),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ConfigPage />)
    const secao = await screen.findByLabelText('Seção de status')

    const linha = within(secao).getByText('Orçado').closest('tr')
    await userEvent.click(within(linha).getByRole('button', { name: /Excluir/ }))

    expect(within(secao).queryByText('Orçado')).not.toBeInTheDocument()
  })
})
