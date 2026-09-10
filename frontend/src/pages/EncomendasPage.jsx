import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { classesCor } from '../utils/cores'
import { formatarData, formatarMoeda } from '../utils/formatacao'

export default function EncomendasPage() {
  const [encomendas, setEncomendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setEncomendas(await api.listarEncomendas())
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function excluir(encomenda) {
    if (!window.confirm(`Excluir a encomenda de ${encomenda.cliente.nome}?`)) return
    try {
      await api.excluirEncomenda(encomenda.id)
      setEncomendas((atual) => atual.filter((e) => e.id !== encomenda.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Encomendas</h1>
        <Link
          to="/encomendas/nova"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova encomenda
        </Link>
      </div>

      {erro && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando encomendas...</p>
      ) : encomendas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma encomenda registrada. Clique em "Nova encomenda" para começar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {encomendas.map((encomenda) => {
                const cores = classesCor(encomenda.status.cor_badge)
                return (
                  <tr key={encomenda.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {encomenda.cliente.nome}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {encomenda.tipo_produto.nome}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      Entrega: {formatarData(encomenda.data_entrega_prevista)}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {formatarMoeda(encomenda.valor_total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${cores.fundo} ${cores.texto}`}
                      >
                        {encomenda.status.nome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/encomendas/${encomenda.id}/editar`}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => excluir(encomenda)}
                          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
