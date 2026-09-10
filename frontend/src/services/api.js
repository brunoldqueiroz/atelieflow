const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

async function requisicao(caminho, { method = 'GET', corpo, params } = {}) {
  const url = new URL(`${BASE_URL}${caminho}`)
  if (params) {
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(chave, valor)
      }
    }
  }

  const resposta = await fetch(url, {
    method,
    headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  })

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}`
    try {
      const dados = await resposta.json()
      if (typeof dados?.detail === 'string') {
        mensagem = dados.detail
      } else if (Array.isArray(dados?.detail)) {
        mensagem = dados.detail.map((item) => item.msg).join('; ')
      }
    } catch {
      // resposta sem corpo JSON — mantém mensagem padrão
    }
    throw new Error(mensagem)
  }

  return resposta.status === 204 ? null : resposta.json()
}

export const api = {
  // RF01 — clientes
  listarClientes: () => requisicao('/clientes'),
  criarCliente: (dados) => requisicao('/clientes', { method: 'POST', corpo: dados }),
  obterCliente: (id) => requisicao(`/clientes/${id}`),
  atualizarCliente: (id, dados) =>
    requisicao(`/clientes/${id}`, { method: 'PUT', corpo: dados }),
  excluirCliente: (id) => requisicao(`/clientes/${id}`, { method: 'DELETE' }),

  // RF02 — tipos de produto
  listarTiposProduto: (apenasAtivos = false) =>
    requisicao('/tipos-produto', {
      params: apenasAtivos ? { apenas_ativos: true } : {},
    }),
  criarTipoProduto: (dados) =>
    requisicao('/tipos-produto', { method: 'POST', corpo: dados }),
  atualizarTipoProduto: (id, dados) =>
    requisicao(`/tipos-produto/${id}`, { method: 'PUT', corpo: dados }),
  excluirTipoProduto: (id) => requisicao(`/tipos-produto/${id}`, { method: 'DELETE' }),

  // RF03 — status do pipeline
  listarStatus: () => requisicao('/status-encomenda'),
  criarStatus: (dados) => requisicao('/status-encomenda', { method: 'POST', corpo: dados }),
  atualizarStatus: (id, dados) =>
    requisicao(`/status-encomenda/${id}`, { method: 'PUT', corpo: dados }),
  excluirStatus: (id) => requisicao(`/status-encomenda/${id}`, { method: 'DELETE' }),

  // RF04 — encomendas
  listarEncomendas: (filtros = {}) =>
    requisicao('/encomendas', {
      params: { status_id: filtros.statusId, cliente_id: filtros.clienteId },
    }),
  criarEncomenda: (dados) => requisicao('/encomendas', { method: 'POST', corpo: dados }),
  obterEncomenda: (id) => requisicao(`/encomendas/${id}`),
  atualizarEncomenda: (id, dados) =>
    requisicao(`/encomendas/${id}`, { method: 'PUT', corpo: dados }),
  excluirEncomenda: (id) => requisicao(`/encomendas/${id}`, { method: 'DELETE' }),
  moverEncomenda: (id, statusId) =>
    requisicao(`/encomendas/${id}/status`, {
      method: 'PATCH',
      corpo: { status_id: statusId },
    }),

  // RF05 — kanban
  obterKanban: () => requisicao('/kanban'),
}
