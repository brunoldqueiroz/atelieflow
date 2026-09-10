import { useCallback, useEffect, useState } from 'react'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { api } from '../services/api'

/** Move o card para a coluna de destino mantendo a ordenação por urgência (RF05). */
export function aplicarMovimento(colunas, encomendaId, novoStatusId) {
  let movida = null
  const colunasSemEncomenda = colunas.map((coluna) => ({
    ...coluna,
    encomendas: coluna.encomendas.filter((encomenda) => {
      if (encomenda.id === encomendaId) {
        movida = encomenda
        return false
      }
      return true
    }),
  }))

  if (!movida) return colunas

  return colunasSemEncomenda.map((coluna) => {
    if (coluna.status.id !== novoStatusId) return coluna
    const encomendas = [...coluna.encomendas, { ...movida, status: coluna.status }]
    encomendas.sort(
      (a, b) =>
        a.data_entrega_prevista.localeCompare(b.data_entrega_prevista) || a.id - b.id,
    )
    return { ...coluna, encomendas }
  })
}

export default function KanbanPage() {
  const [colunas, setColunas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await api.obterKanban()
      setColunas(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function aoMover(encomenda, novoStatusId) {
    const colunasAnteriores = colunas
    setErro(null)
    setColunas(aplicarMovimento(colunas, encomenda.id, novoStatusId))
    try {
      await api.moverEncomenda(encomenda.id, novoStatusId)
    } catch (e) {
      setColunas(colunasAnteriores)
      setErro(e.message)
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-slate-800">Esteira de Confecção</h1>

      {erro && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          <span>{erro}</span>
          <button
            type="button"
            onClick={carregar}
            className="rounded border border-red-300 bg-white px-3 py-1 text-xs font-medium hover:bg-red-50"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando painel...</p>
      ) : colunas.length === 0 && !erro ? (
        <p className="text-sm text-slate-500">
          Nenhum status configurado. Ajuste as etapas na tela de Configurações.
        </p>
      ) : (
        <KanbanBoard colunas={colunas} onMover={aoMover} />
      )}
    </div>
  )
}
