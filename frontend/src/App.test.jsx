import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { servidor } from './test/servidor'

const BASE = 'http://localhost:8000/api'

function mockGeral() {
  servidor.use(
    http.get(`${BASE}/kanban`, () => HttpResponse.json([])),
    http.get(`${BASE}/clientes`, () => HttpResponse.json([])),
    http.get(`${BASE}/encomendas`, () => HttpResponse.json([])),
    http.get(`${BASE}/tipos-produto`, () => HttpResponse.json([])),
    http.get(`${BASE}/status-encomenda`, () => HttpResponse.json([])),
  )
}

function renderApp(caminho = '/') {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('exibe a marca e os links de navegação', () => {
    mockGeral()
    renderApp()

    expect(screen.getByText('AteliêFlow')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kanban' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Encomendas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Configurações' })).toBeInTheDocument()
  })

  it('rota inicial redireciona para o kanban', async () => {
    mockGeral()
    renderApp('/')

    expect(
      await screen.findByRole('heading', { name: 'Esteira de Confecção' }),
    ).toBeInTheDocument()
  })

  it('navega para a página de clientes pelo menu', async () => {
    mockGeral()
    renderApp('/')

    await userEvent.click(screen.getByRole('link', { name: 'Clientes' }))

    expect(
      await screen.findByRole('heading', { name: 'Clientes' }),
    ).toBeInTheDocument()
  })

  it('exibe página não encontrada para rota desconhecida', () => {
    mockGeral()
    renderApp('/rota-inexistente')

    expect(screen.getByText(/Página não encontrada/)).toBeInTheDocument()
  })
})
