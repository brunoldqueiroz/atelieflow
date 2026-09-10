import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import KanbanBoard, { resolverMovimento } from './KanbanBoard'

function encomenda(id, nomeCliente, status) {
  return {
    id,
    detalhes_personalizacao: 'Capa dura floral',
    data_entrega_prevista: '2099-12-01',
    valor_total: '90.00',
    valor_sinal: '0.00',
    cliente: { id, nome: nomeCliente, telefone: '419' },
    tipo_produto: { id: 1, nome: 'Agenda', ativo: true },
    status,
  }
}

const STATUS = [
  { id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' },
  { id: 3, nome: 'Em Produção', ordem: 3, cor_badge: 'blue' },
  { id: 5, nome: 'Entregue', ordem: 5, cor_badge: 'violet' },
]

function colunasBase() {
  return [
    { status: STATUS[0], encomendas: [encomenda(10, 'Maria Silva', STATUS[0])] },
    { status: STATUS[1], encomendas: [encomenda(20, 'Ana Souza', STATUS[1])] },
    { status: STATUS[2], encomendas: [encomenda(30, 'Joana Lima', STATUS[2])] },
  ]
}

describe('KanbanBoard', () => {
  it('renderiza uma coluna por status', () => {
    render(<KanbanBoard colunas={colunasBase()} onMover={vi.fn()} />)

    expect(screen.getByText('Orçado')).toBeInTheDocument()
    expect(screen.getByText('Em Produção')).toBeInTheDocument()
    expect(screen.getByText('Entregue')).toBeInTheDocument()
  })

  it('primeira coluna não tem retroceder e última não tem avançar', () => {
    render(<KanbanBoard colunas={colunasBase()} onMover={vi.fn()} />)

    const colunaOrcado = screen.getByLabelText('Coluna Orçado')
    const colunaEntregue = screen.getByLabelText('Coluna Entregue')

    expect(
      colunaOrcado.querySelector('[aria-label="Retroceder status"]'),
    ).not.toBeInTheDocument()
    expect(
      colunaOrcado.querySelector('[aria-label="Avançar status"]'),
    ).toBeInTheDocument()
    expect(
      colunaEntregue.querySelector('[aria-label="Avançar status"]'),
    ).not.toBeInTheDocument()
    expect(
      colunaEntregue.querySelector('[aria-label="Retroceder status"]'),
    ).toBeInTheDocument()
  })

  it('avançar da primeira coluna move para o status seguinte', async () => {
    const onMover = vi.fn()
    render(<KanbanBoard colunas={colunasBase()} onMover={onMover} />)

    const coluna = screen.getByLabelText('Coluna Orçado')
    await userEvent.click(
      coluna.querySelector('[aria-label="Avançar status"]'),
    )

    expect(onMover).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      3,
    )
  })

  it('retroceder da coluna do meio move para o status anterior', async () => {
    const onMover = vi.fn()
    render(<KanbanBoard colunas={colunasBase()} onMover={onMover} />)

    const coluna = screen.getByLabelText('Coluna Em Produção')
    await userEvent.click(
      coluna.querySelector('[aria-label="Retroceder status"]'),
    )

    expect(onMover).toHaveBeenCalledWith(
      expect.objectContaining({ id: 20 }),
      1,
    )
  })
})

describe('resolverMovimento (drag and drop)', () => {
  it('resolve encomenda arrastada para outra coluna', () => {
    const colunas = colunasBase()

    const movimento = resolverMovimento(colunas, 'encomenda-10', 'status-3')

    expect(movimento.encomenda.id).toBe(10)
    expect(movimento.novoStatusId).toBe(3)
  })

  it('ignora soltar na mesma coluna', () => {
    expect(resolverMovimento(colunasBase(), 'encomenda-10', 'status-1')).toBeNull()
  })

  it('ignora quando não há alvo de destino', () => {
    expect(resolverMovimento(colunasBase(), 'encomenda-10', null)).toBeNull()
    expect(resolverMovimento(colunasBase(), 'encomenda-10', undefined)).toBeNull()
  })

  it('ignora identificadores desconhecidos', () => {
    expect(resolverMovimento(colunasBase(), 'encomenda-999', 'status-3')).toBeNull()
  })
})
