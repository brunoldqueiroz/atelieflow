import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { classesCor } from '../utils/cores'

const CORES_OPCOES = [
  { valor: 'slate', rotulo: 'Cinza' },
  { valor: 'amber', rotulo: 'Âmbar' },
  { valor: 'blue', rotulo: 'Azul' },
  { valor: 'emerald', rotulo: 'Esmeralda' },
  { valor: 'violet', rotulo: 'Violeta' },
  { valor: 'red', rotulo: 'Vermelho' },
]

function Alerta({ mensagem }) {
  if (!mensagem) return null
  return (
    <div role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
      {mensagem}
    </div>
  )
}

export default function ConfigPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
      <SecaoTiposProduto />
      <SecaoStatus />
    </div>
  )
}

function SecaoTiposProduto() {
  const [tipos, setTipos] = useState([])
  const [novoNome, setNovoNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setTipos(await api.listarTiposProduto())
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar(evento) {
    evento.preventDefault()
    setErro(null)
    try {
      const criado = await api.criarTipoProduto({ nome: novoNome, ativo: true })
      setTipos((atual) => [...atual, criado].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovoNome('')
    } catch (e) {
      setErro(e.message)
    }
  }

  async function alternarAtivo(tipo) {
    setErro(null)
    try {
      const atualizado = await api.atualizarTipoProduto(tipo.id, { ativo: !tipo.ativo })
      setTipos((atual) => atual.map((t) => (t.id === tipo.id ? atualizado : t)))
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(tipo) {
    if (!window.confirm(`Excluir o tipo ${tipo.nome}?`)) return
    setErro(null)
    try {
      await api.excluirTipoProduto(tipo.id)
      setTipos((atual) => atual.filter((t) => t.id !== tipo.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section aria-label="Seção de tipos de produto" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Tipos de produto</h2>
      <Alerta mensagem={erro} />

      <form onSubmit={adicionar} className="mb-4 flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Nome do novo tipo
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            required
            maxLength={60}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Adicionar
        </button>
      </form>

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Situação</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tipos.map((tipo) => (
              <tr key={tipo.id}>
                <td className="px-3 py-2 font-medium text-slate-800">{tipo.nome}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipo.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {tipo.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => alternarAtivo(tipo)} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                      {tipo.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button type="button" onClick={() => excluir(tipo)} className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function SecaoStatus() {
  const [statusLista, setStatusLista] = useState([])
  const [novo, setNovo] = useState({ nome: '', ordem: '', cor_badge: 'slate' })
  const [editandoId, setEditandoId] = useState(null)
  const [edicao, setEdicao] = useState({ nome: '', ordem: '', cor_badge: 'slate' })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setStatusLista(await api.listarStatus())
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function ordenar(lista) {
    return [...lista].sort((a, b) => a.ordem - b.ordem)
  }

  async function adicionar(evento) {
    evento.preventDefault()
    setErro(null)
    try {
      const criado = await api.criarStatus({
        nome: novo.nome,
        ordem: Number(novo.ordem),
        cor_badge: novo.cor_badge,
      })
      setStatusLista((atual) => ordenar([...atual, criado]))
      setNovo({ nome: '', ordem: '', cor_badge: 'slate' })
    } catch (e) {
      setErro(e.message)
    }
  }

  function iniciarEdicao(status) {
    setEditandoId(status.id)
    setEdicao({ nome: status.nome, ordem: String(status.ordem), cor_badge: status.cor_badge ?? 'slate' })
  }

  async function salvarEdicao(status) {
    setErro(null)
    try {
      const atualizado = await api.atualizarStatus(status.id, {
        nome: edicao.nome,
        ordem: Number(edicao.ordem),
        cor_badge: edicao.cor_badge,
      })
      setStatusLista((atual) => ordenar(atual.map((s) => (s.id === status.id ? atualizado : s))))
      setEditandoId(null)
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(status) {
    if (!window.confirm(`Excluir o status ${status.nome}?`)) return
    setErro(null)
    try {
      await api.excluirStatus(status.id)
      setStatusLista((atual) => atual.filter((s) => s.id !== status.id))
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <section aria-label="Seção de status" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">Etapas do pipeline (status)</h2>
      <Alerta mensagem={erro} />

      <form onSubmit={adicionar} className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Nome do novo status
          <input value={novo.nome} onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))} required maxLength={40} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm font-medium text-slate-700">
          Ordem
          <input type="number" min="1" value={novo.ordem} onChange={(e) => setNovo((n) => ({ ...n, ordem: e.target.value }))} required className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Cor
          <select value={novo.cor_badge} onChange={(e) => setNovo((n) => ({ ...n, cor_badge: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2">
            {CORES_OPCOES.map((cor) => (
              <option key={cor.valor} value={cor.valor}>{cor.rotulo}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Adicionar
        </button>
      </form>

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Ordem</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Cor</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statusLista.map((status) => (
              <LinhaStatus
                key={status.id}
                status={status}
                editando={editandoId === status.id}
                edicao={edicao}
                onMudarEdicao={setEdicao}
                onEditar={() => iniciarEdicao(status)}
                onSalvar={() => salvarEdicao(status)}
                onCancelar={() => setEditandoId(null)}
                onExcluir={() => excluir(status)}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}


function LinhaStatus({ status, editando, edicao, onMudarEdicao, onEditar, onSalvar, onCancelar, onExcluir }) {
  const cores = classesCor(status.cor_badge)

  if (editando) {
    return (
      <tr>
        <td className="px-3 py-2">
          <input aria-label="Ordem" type="number" min="1" value={edicao.ordem} onChange={(e) => onMudarEdicao((ed) => ({ ...ed, ordem: e.target.value }))} className="w-20 rounded-lg border border-slate-300 px-2 py-1" />
        </td>
        <td className="px-3 py-2">
          <input aria-label="Nome do status" value={edicao.nome} onChange={(e) => onMudarEdicao((ed) => ({ ...ed, nome: e.target.value }))} maxLength={40} className="w-full rounded-lg border border-slate-300 px-2 py-1" />
        </td>
        <td className="px-3 py-2">
          <select aria-label="Cor" value={edicao.cor_badge} onChange={(e) => onMudarEdicao((ed) => ({ ...ed, cor_badge: e.target.value }))} className="rounded-lg border border-slate-300 px-2 py-1">
            {CORES_OPCOES.map((cor) => (
              <option key={cor.valor} value={cor.valor}>{cor.rotulo}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-2">
            <button type="button" onClick={onSalvar} className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">
              Salvar
            </button>
            <button type="button" onClick={onCancelar} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td className="px-3 py-2 text-slate-600">{status.ordem}</td>
      <td className="px-3 py-2 font-medium text-slate-800">{status.nome}</td>
      <td className="px-3 py-2">
        <span className={`inline-block h-4 w-4 rounded-full ${cores.ponto}`} aria-label={`Cor ${status.cor_badge}`} />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <button type="button" onClick={onEditar} className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
            Editar
          </button>
          <button type="button" onClick={onExcluir} className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
            Excluir
          </button>
        </div>
      </td>
    </tr>
  )
}

