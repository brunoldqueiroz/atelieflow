const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** '2026-09-15' -> '15/09/2026' (sem conversão de fuso, pois é data pura). */
export function formatarData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** Aceita número ou string decimal vinda da API e formata em Real. */
export function formatarMoeda(valor) {
  return formatadorMoeda.format(Number(valor))
}

/** Data local de hoje no formato ISO aaaa-mm-dd. */
export function hojeISO() {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

/**
 * Classifica a urgência de uma data de entrega.
 * Datas ISO (aaaa-mm-dd) podem ser comparadas lexicograficamente.
 */
export function situacaoPrazo(isoData, hoje = hojeISO()) {
  if (isoData < hoje) return 'atrasada'
  if (isoData === hoje) return 'hoje'
  const limite = new Date(`${hoje}T00:00:00Z`)
  limite.setUTCDate(limite.getUTCDate() + 2)
  const limiteISO = limite.toISOString().slice(0, 10)
  return isoData <= limiteISO ? 'urgente' : 'no_prazo'
}
