import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EncomendaCard from './EncomendaCard'

function encomendaBase(sobreescrito = {}) {
  return {
    id: 1,
    detalhes_personalizacao: "Capa rosa, nome 'Maria' em dourado",
    data_entrega_prevista: '2099-12-01',
    valor_total: '150.00',
    valor_sinal: '50.00',
    cliente: { id: 1, nome: 'Maria Silva', telefone: '41999990001' },
    tipo_produto: { id: 1, nome: 'Caderno', ativo: true },
    status: { id: 1, nome: 'Orçado', ordem: 1, cor_badge: 'slate' },
    ...sobreescrito,
  }
}

describe('EncomendaCard', () => {
  it('exibe cliente, tipo, personalização, data e valores', () => {
    render(<EncomendaCard encomenda={encomendaBase()} />)

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Caderno')).toBeInTheDocument()
    expect(screen.getByText(/Capa rosa/)).toBeInTheDocument()
    expect(screen.getByText('Entrega: 01/12/2099')).toBeInTheDocument()
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument()
    expect(screen.getByText(/Sinal: R\$ 50,00/)).toBeInTheDocument()
  })

  it('sinaliza encomenda atrasada', () => {
    render(<EncomendaCard encomenda={encomendaBase({ data_entrega_prevista: '2020-01-10' })} />)

    expect(screen.getByText('Atrasada')).toBeInTheDocument()
  })

  it('não exibe badge de urgência para entrega distante', () => {
    render(<EncomendaCard encomenda={encomendaBase({ data_entrega_prevista: '2099-12-01' })} />)

    expect(screen.queryByText('Atrasada')).not.toBeInTheDocument()
    expect(screen.queryByText('Urgente')).not.toBeInTheDocument()
    expect(screen.queryByText('Entrega hoje')).not.toBeInTheDocument()
  })

  it('aciona onAvancar ao clicar em avançar', async () => {
    const onAvancar = vi.fn()
    const encomenda = encomendaBase()
    render(<EncomendaCard encomenda={encomenda} onAvancar={onAvancar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Avançar status' }))

    expect(onAvancar).toHaveBeenCalledWith(encomenda)
  })

  it('aciona onRetroceder ao clicar em retroceder', async () => {
    const onRetroceder = vi.fn()
    const encomenda = encomendaBase()
    render(<EncomendaCard encomenda={encomenda} onRetroceder={onRetroceder} />)

    await userEvent.click(screen.getByRole('button', { name: 'Retroceder status' }))

    expect(onRetroceder).toHaveBeenCalledWith(encomenda)
  })

  it('omite botões de movimentação quando handlers não são fornecidos', () => {
    render(<EncomendaCard encomenda={encomendaBase()} />)

    expect(screen.queryByRole('button', { name: 'Avançar status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retroceder status' })).not.toBeInTheDocument()
  })
})
