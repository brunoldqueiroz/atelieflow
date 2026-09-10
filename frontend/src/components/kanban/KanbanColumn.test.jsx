import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import KanbanColumn from './KanbanColumn'

function encomenda(id, nomeCliente) {
  return {
    id,
    detalhes_personalizacao: 'Capa dura floral',
    data_entrega_prevista: '2099-12-01',
    valor_total: '90.00',
    valor_sinal: '0.00',
    cliente: { id, nome: nomeCliente, telefone: '419' },
    tipo_produto: { id: 1, nome: 'Agenda', ativo: true },
    status: { id: 3, nome: 'Em Produção', ordem: 3, cor_badge: 'blue' },
  }
}

function colunaBase(sobreescrito = {}) {
  return {
    status: { id: 3, nome: 'Em Produção', ordem: 3, cor_badge: 'blue' },
    encomendas: [encomenda(1, 'Maria Silva'), encomenda(2, 'Ana Souza')],
    ...sobreescrito,
  }
}

describe('KanbanColumn', () => {
  it('exibe nome do status e contagem de encomendas', () => {
    render(<KanbanColumn coluna={colunaBase()} />)

    expect(screen.getByText('Em Produção')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renderiza os cards das encomendas', () => {
    render(<KanbanColumn coluna={colunaBase()} />)

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há encomendas', () => {
    render(<KanbanColumn coluna={colunaBase({ encomendas: [] })} />)

    expect(screen.getByText('Nenhuma encomenda')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('aplica a cor da cor_badge no cabeçalho', () => {
    render(<KanbanColumn coluna={colunaBase()} />)

    const titulo = screen.getByText('Em Produção')
    expect(titulo.className).toContain('text-blue-700')
  })

  it('usa cor padrão quando cor_badge é desconhecida', () => {
    const coluna = colunaBase()
    coluna.status = { ...coluna.status, cor_badge: 'rosa-choque' }
    render(<KanbanColumn coluna={coluna} />)

    const titulo = screen.getByText('Em Produção')
    expect(titulo.className).toContain('text-slate-700')
  })

  it('repassa ações de mover para os cards', async () => {
    const onAvancar = vi.fn()
    render(<KanbanColumn coluna={colunaBase()} onAvancar={onAvancar} />)

    const botoes = screen.getAllByRole('button', { name: 'Avançar status' })
    await userEvent.click(botoes[0])

    expect(onAvancar).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, cliente: expect.objectContaining({ nome: 'Maria Silva' }) }),
    )
  })
})
