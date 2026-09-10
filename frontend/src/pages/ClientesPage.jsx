import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatarData, formatarMoeda } from '../utils/formatacao'

const FORM_VAZIO = { nome: '', telefone: '', observacoes: '' }

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [formVisivel, setFormVisivel] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [expandidoId, setExpandidoId] = useState(null)
  const [historico, setHistorico] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setClientes(await api.listarClientes())
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setFormVisivel(true)
  }

  function abrirEdicao(cliente) {
    setEditandoId(cliente.id)
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      observacoes: cliente.observacoes ?? '',
    })
    setFormVisivel(true)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro(null)
    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      observacoes: form.observacoes.trim() || null,
    }
    try {
      if (editandoId) {
        const atualizado = await api.atualizarCliente(editandoId, payload)
        setClientes((atual) =>
          atual.map((c) => (c.id === editandoId ? atualizado : c)),
        )
      } else {
        const criado = await api.criarCliente(payload)
        setClientes((atual) =>
          [...atual, criado].sort((a, b) => a.nome.localeCompare(b.nome)),
        )
      }
      setFormVisivel(false)
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(cliente) {
    if (!window.confirm(`Excluir o cliente ${cliente.nome}?`)) return
    setErro(null)
    try {
      await api.excluirCliente(cliente.id)
      setClientes((atual) => atual.filter((c) => c.id !== cliente.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  async function alternarHistorico(cliente) {
    if (expandidoId === cliente.id) {
      setExpandidoId(null)
      return
    }
    setExpandidoId(cliente.id)
    setCarregandoHistorico(true)
    setErro(null)
    try {
      const detalhe = await api.obterCliente(cliente.id)
      setHistorico(detalhe.encomendas)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
        <button
          type="button"
          onClick={abrirNovo}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo cliente
        </button>
      </div>

      {erro && (
        <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {formVisivel && (
        <form onSubmit={salvar} className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
              maxLength={120}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Telefone/WhatsApp
            <input
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              required
              maxLength={20}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Observações
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              placeholder="Preferências, laminação favorita, detalhes recorrentes..."
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Salvar
            </button>
            <button type="button" onClick={() => setFormVisivel(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando clientes...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Observações</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <LinhaCliente
                  key={cliente.id}
                  cliente={cliente}
                  expandido={expandidoId === cliente.id}
                  historico={historico}
                  carregandoHistorico={carregandoHistorico}
                  onHistorico={() => alternarHistorico(cliente)}
                  onEditar={() => abrirEdicao(cliente)}
                  onExcluir={() => excluir(cliente)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LinhaCliente({ cliente, expandido, historico, carregandoHistorico, onHistorico, onEditar, onExcluir }) {
  return (
    <>
      <tr>
        <td className="px-4 py-3 font-medium text-slate-800">{cliente.nome}</td>
        <td className="px-4 py-3 text-slate-600">{cliente.telefone}</td>
        <td className="max-w-xs truncate px-4 py-3 text-slate-500">{cliente.observacoes}</td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button type="button" onClick={onHistorico} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Histórico
            </button>
            <button type="button" onClick={onEditar} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Editar
            </button>
            <button type="button" onClick={onExcluir} className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
              Excluir
            </button>
          </div>
        </td>
      </tr>
      {expandido && (
        <tr>
          <td colSpan={4} className="bg-slate-50 px-4 py-3">
            {carregandoHistorico ? (
              <p className="text-xs text-slate-500">Carregando histórico...</p>
            ) : historico.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma encomenda registrada para este cliente.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-xs text-slate-600">
                {historico.map((encomenda) => (
                  <li key={encomenda.id} className="flex flex-wrap gap-x-3">
                    <span className="font-medium">{encomenda.tipo_produto.nome}</span>
                    <span>Entrega: {formatarData(encomenda.data_entrega_prevista)}</span>
                    <span>{formatarMoeda(encomenda.valor_total)}</span>
                    <span className="italic">{encomenda.status.nome}</span>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
