import { classesCor } from '../../utils/cores'
import EncomendaCard from './EncomendaCard'

export default function KanbanColumn({ coluna, onAvancar, onRetroceder, envolverCard }) {
  const cores = classesCor(coluna.status.cor_badge)

  return (
    <section
      aria-label={`Coluna ${coluna.status.nome}`}
      className={`flex w-72 shrink-0 flex-col rounded-xl border ${cores.borda} ${cores.fundo} p-3`}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${cores.ponto}`} aria-hidden="true" />
          <h2 className={`text-sm font-bold ${cores.texto}`}>{coluna.status.nome}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
          {coluna.encomendas.length}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {coluna.encomendas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white/50 p-3 text-center text-xs text-slate-400">
            Nenhuma encomenda
          </p>
        ) : (
          coluna.encomendas.map((encomenda) => {
            const card = (
              <EncomendaCard
                key={encomenda.id}
                encomenda={encomenda}
                onAvancar={onAvancar}
                onRetroceder={onRetroceder}
              />
            )
            return envolverCard ? envolverCard(encomenda, card) : card
          })
        )}
      </div>
    </section>
  )
}
