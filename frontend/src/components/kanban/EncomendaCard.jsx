import { formatarData, formatarMoeda, situacaoPrazo } from '../../utils/formatacao'

const ROTULOS_BADGE = {
  atrasada: 'Atrasada',
  hoje: 'Entrega hoje',
  urgente: 'Urgente',
}

const ESTILOS_BADGE = {
  atrasada: 'border-red-300 bg-red-100 text-red-700',
  hoje: 'border-orange-300 bg-orange-100 text-orange-700',
  urgente: 'border-amber-300 bg-amber-100 text-amber-700',
}

export default function EncomendaCard({ encomenda, onAvancar, onRetroceder }) {
  const situacao = situacaoPrazo(encomenda.data_entrega_prevista)
  const rotuloBadge = ROTULOS_BADGE[situacao]

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          {encomenda.cliente.nome}
        </h3>
        {rotuloBadge && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILOS_BADGE[situacao]}`}
          >
            {rotuloBadge}
          </span>
        )}
      </header>

      <p className="text-xs font-medium text-slate-500">{encomenda.tipo_produto.nome}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
        {encomenda.detalhes_personalizacao}
      </p>

      <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
        <span>Entrega: {formatarData(encomenda.data_entrega_prevista)}</span>
        <span className="font-semibold">{formatarMoeda(encomenda.valor_total)}</span>
      </div>
      <p className="text-xs text-slate-500">
        Sinal: {formatarMoeda(encomenda.valor_sinal)}
      </p>

      {(onRetroceder || onAvancar) && (
        <footer className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          {onRetroceder ? (
            <button
              type="button"
              aria-label="Retroceder status"
              onClick={() => onRetroceder(encomenda)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              ◀ Voltar
            </button>
          ) : (
            <span />
          )}
          {onAvancar && (
            <button
              type="button"
              aria-label="Avançar status"
              onClick={() => onAvancar(encomenda)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Avançar ▶
            </button>
          )}
        </footer>
      )}
    </article>
  )
}
