import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'

const FORM_INICIAL = {
  cliente_id: '',
  tipo_produto_id: '',
  status_id: '',
  detalhes_personalizacao: '',
  data_entrega_prevista: '',
  valor_total: '',
  valor_sinal: '',
  observacoes_internas: '',
}

export default function EncomendaFormPage() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(FORM_INICIAL)
  const [clientes, setClientes] = useState([])
  const [tipos, setTipos] = useState([])
  const [statusLista, setStatusLista] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [listaClientes, listaTipos, listaStatus] = await Promise.all([
        api.listarClientes(),
        api.listarTiposProduto(true),
        api.listarStatus(),
      ])
      setClientes(listaClientes)
      setTipos(listaTipos)
      setStatusLista(listaStatus)

      if (editando) {
        const encomenda = await api.obterEncomenda(id)
        setForm({
          cliente_id: String(encomenda.cliente_id),
          tipo_produto_id: String(encomenda.tipo_produto_id),
          status_id: String(encomenda.status_id),
          detalhes_personalizacao: encomenda.detalhes_personalizacao,
          data_entrega_prevista: encomenda.data_entrega_prevista,
          valor_total: String(Number(encomenda.valor_total)),
          valor_sinal: String(Number(encomenda.valor_sinal)),
          observacoes_internas: encomenda.observacoes_internas ?? '',
        })
      }
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [editando, id])

  useEffect(() => {
    carregar()
  }, [carregar])

  function aoMudar(campo) {
    return (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.value }))
  }

  async function aoSalvar(evento) {
    evento.preventDefault()
    setErro(null)

    const valorTotal = Number(form.valor_total)
    const valorSinal = form.valor_sinal === '' ? 0 : Number(form.valor_sinal)
    if (valorSinal > valorTotal) {
      setErro('O valor do sinal não pode ser maior que o valor total')
      return
    }

    const payload = {
      cliente_id: Number(form.cliente_id),
      tipo_produto_id: Number(form.tipo_produto_id),
      status_id: Number(form.status_id),
      detalhes_personalizacao: form.detalhes_personalizacao,
      data_entrega_prevista: form.data_entrega_prevista,
      valor_total: valorTotal,
      valor_sinal: valorSinal,
      observacoes_internas: form.observacoes_internas.trim() || null,
    }

    setSalvando(true)
    try {
      if (editando) {
        await api.atualizarEncomenda(id, payload)
      } else {
        await api.criarEncomenda(payload)
      }
      navigate('/encomendas')
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p className="text-sm text-slate-500">Carregando formulário...</p>
  }


  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">
        {editando ? 'Editar encomenda' : 'Nova encomenda'}
      </h1>

      {erro && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {erro}
        </div>
      )}

      <form onSubmit={aoSalvar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Cliente
          <select value={form.cliente_id} onChange={aoMudar('cliente_id')} required className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Selecione...</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Tipo de produto
            <select value={form.tipo_produto_id} onChange={aoMudar('tipo_produto_id')} required className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Selecione...</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Status
            <select value={form.status_id} onChange={aoMudar('status_id')} required className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Selecione...</option>
              {statusLista.map((status) => (
                <option key={status.id} value={status.id}>{status.nome}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Detalhes da personalização
          <textarea
            value={form.detalhes_personalizacao}
            onChange={aoMudar('detalhes_personalizacao')}
            required
            rows={3}
            placeholder="Ex.: capa rosa, nome 'Maria' em dourado, miolo pautado..."
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Data de entrega
            <input type="date" value={form.data_entrega_prevista} onChange={aoMudar('data_entrega_prevista')} required className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Valor total (R$)
            <input type="number" min="0" step="0.01" value={form.valor_total} onChange={aoMudar('valor_total')} required className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Valor do sinal (R$)
            <input type="number" min="0" step="0.01" value={form.valor_sinal} onChange={aoMudar('valor_sinal')} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Observações internas
          <textarea value={form.observacoes_internas} onChange={aoMudar('observacoes_internas')} rows={2} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/encomendas')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
