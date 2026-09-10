import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { servidor } from '../test/servidor'
import EncomendaFormPage from './EncomendaFormPage'

const BASE = 'http://localhost:8000/api'

function mockCombos() {
  servidor.use(
    http.get(`${BASE}/clientes`, () =>
      HttpResponse.json([{ id: 1, nome: 'Maria Silva', telefone: '419', observacoes: null }]),
    ),
    http.get(`${BASE}/tipos-produto`, () =>
      HttpResponse.json([{ id: 1, nome: 'Caderno', ativo: true }]),
    ),
    http.get(`${BASE}/status-encomenda`, () =>
      HttpResponse.json([{ id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' }]),
    ),
  )
}

function renderForm(caminho = '/encomendas/nova') {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/encomendas/nova" element={<EncomendaFormPage />} />
        <Route path="/encomendas/:id/editar" element={<EncomendaFormPage />} />
        <Route path="/encomendas" element={<p>Lista de encomendas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function preencherFormulario({ sinal = '50', total = '150' } = {}) {
  await userEvent.selectOptions(screen.getByLabelText('Cliente'), '1')
  await userEvent.selectOptions(screen.getByLabelText('Tipo de produto'), '1')
  await userEvent.selectOptions(screen.getByLabelText('Status'), '1')
  await userEvent.type(
    screen.getByLabelText('Detalhes da personalização'),
    'Capa rosa com nome bordado',
  )
  fireEvent.change(screen.getByLabelText('Data de entrega'), {
    target: { value: '2026-10-01' },
  })
  await userEvent.type(screen.getByLabelText('Valor total (R$)'), total)
  await userEvent.type(screen.getByLabelText('Valor do sinal (R$)'), sinal)
}

describe('EncomendaFormPage — criação', () => {
  it('popula os combos a partir da API', async () => {
    mockCombos()
    renderForm()

    expect(await screen.findByRole('option', { name: 'Maria Silva' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Caderno' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Orçado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nova encomenda' })).toBeInTheDocument()
  })

  it('envia POST com payload correto e volta para a lista', async () => {
    mockCombos()
    let corpoPost
    servidor.use(
      http.post(`${BASE}/encomendas`, async ({ request }) => {
        corpoPost = await request.json()
        return HttpResponse.json({ id: 9 }, { status: 201 })
      }),
    )
    renderForm()
    await screen.findByRole('option', { name: 'Maria Silva' })

    await preencherFormulario()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(corpoPost).toEqual({
      cliente_id: 1,
      tipo_produto_id: 1,
      status_id: 1,
      detalhes_personalizacao: 'Capa rosa com nome bordado',
      data_entrega_prevista: '2026-10-01',
      valor_total: 150,
      valor_sinal: 50,
      observacoes_internas: null,
    })
    expect(await screen.findByText('Lista de encomendas')).toBeInTheDocument()
  })

  it('bloqueia envio quando sinal é maior que o total', async () => {
    mockCombos()
    let postChamado = false
    servidor.use(
      http.post(`${BASE}/encomendas`, () => {
        postChamado = true
        return HttpResponse.json({ id: 9 }, { status: 201 })
      }),
    )
    renderForm()
    await screen.findByRole('option', { name: 'Maria Silva' })

    await preencherFormulario({ total: '100', sinal: '150' })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(postChamado).toBe(false)
    expect(screen.getByRole('alert')).toHaveTextContent(
      /sinal não pode ser maior que o valor total/i,
    )
  })

  it('exibe o erro retornado pela API', async () => {
    mockCombos()
    servidor.use(
      http.post(`${BASE}/encomendas`, () =>
        HttpResponse.json(
          { detail: 'valor_sinal não pode ser maior que valor_total' },
          { status: 422 },
        ),
      ),
    )
    renderForm()
    await screen.findByRole('option', { name: 'Maria Silva' })

    await preencherFormulario()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /valor_sinal não pode ser maior que valor_total/,
    )
  })
})



describe('EncomendaFormPage — edição', () => {
  const encomendaExistente = {
    id: 5,
    cliente_id: 1,
    tipo_produto_id: 1,
    status_id: 1,
    detalhes_personalizacao: 'Capa azul, miolo pontilhado',
    data_pedido: '2026-09-01T10:00:00',
    data_entrega_prevista: '2026-11-20',
    valor_total: '200.00',
    valor_sinal: '80.00',
    observacoes_internas: 'Cliente pediu urgência',
    cliente: { id: 1, nome: 'Maria Silva', telefone: '419', observacoes: null },
    tipo_produto: { id: 1, nome: 'Caderno', ativo: true },
    status: { id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' },
  }

  function mockEdicao() {
    mockCombos()
    servidor.use(
      http.get(`${BASE}/encomendas/5`, () => HttpResponse.json(encomendaExistente)),
    )
  }

  it('carrega os dados existentes nos campos', async () => {
    mockEdicao()
    renderForm('/encomendas/5/editar')

    expect(
      await screen.findByRole('heading', { name: 'Editar encomenda' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Detalhes da personalização')).toHaveValue(
      'Capa azul, miolo pontilhado',
    )
    expect(screen.getByLabelText('Cliente')).toHaveValue('1')
    expect(screen.getByLabelText('Data de entrega')).toHaveValue('2026-11-20')
    expect(screen.getByLabelText('Valor total (R$)')).toHaveValue(200)
    expect(screen.getByLabelText('Valor do sinal (R$)')).toHaveValue(80)
    expect(screen.getByLabelText('Observações internas')).toHaveValue(
      'Cliente pediu urgência',
    )
  })

  it('envia PUT com as alterações', async () => {
    mockEdicao()
    let corpoPut
    servidor.use(
      http.put(`${BASE}/encomendas/5`, async ({ request }) => {
        corpoPut = await request.json()
        return HttpResponse.json(encomendaExistente)
      }),
    )
    renderForm('/encomendas/5/editar')
    await screen.findByRole('heading', { name: 'Editar encomenda' })

    const campoSinal = screen.getByLabelText('Valor do sinal (R$)')
    await userEvent.clear(campoSinal)
    await userEvent.type(campoSinal, '120')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(corpoPut).toMatchObject({ valor_sinal: 120, valor_total: 200 })
    expect(await screen.findByText('Lista de encomendas')).toBeInTheDocument()
  })
})
