import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import KanbanColumn from './KanbanColumn'

/**
 * Interpreta o fim de um arraste: retorna { encomenda, novoStatusId }
 * ou null quando a soltura não representa mudança de status.
 */
export function resolverMovimento(colunas, activeId, overId) {
  if (activeId == null || overId == null) return null

  const encomendaId = Number(String(activeId).replace('encomenda-', ''))
  const novoStatusId = Number(String(overId).replace('status-', ''))
  if (Number.isNaN(encomendaId) || Number.isNaN(novoStatusId)) return null

  for (const coluna of colunas) {
    const encomenda = coluna.encomendas.find((e) => e.id === encomendaId)
    if (encomenda) {
      if (encomenda.status.id === novoStatusId) return null
      return { encomenda, novoStatusId }
    }
  }
  return null
}

function ColunaDroppable({ statusId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `status-${statusId}` })
  return (
    <div ref={setNodeRef} className={isOver ? 'rounded-xl ring-2 ring-blue-400' : ''}>
      {children}
    </div>
  )
}

function CartaoArrastavel({ encomenda, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `encomenda-${encomenda.id}`,
  })
  const estilo = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={estilo}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? 'z-10 opacity-60' : ''}`}
    >
      {children}
    </div>
  )
}

export default function KanbanBoard({ colunas, onMover }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function aoSoltar(event) {
    const movimento = resolverMovimento(colunas, event.active?.id, event.over?.id)
    if (movimento) onMover(movimento.encomenda, movimento.novoStatusId)
  }

  function envolverCard(encomenda, card) {
    return (
      <CartaoArrastavel key={encomenda.id} encomenda={encomenda}>
        {card}
      </CartaoArrastavel>
    )
  }

  return (
    <DndContext sensors={sensores} onDragEnd={aoSoltar}>
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {colunas.map((coluna, indice) => (
          <ColunaDroppable key={coluna.status.id} statusId={coluna.status.id}>
            <KanbanColumn
              coluna={coluna}
              envolverCard={envolverCard}
              onRetroceder={
                indice > 0
                  ? (encomenda) => onMover(encomenda, colunas[indice - 1].status.id)
                  : undefined
              }
              onAvancar={
                indice < colunas.length - 1
                  ? (encomenda) => onMover(encomenda, colunas[indice + 1].status.id)
                  : undefined
              }
            />
          </ColunaDroppable>
        ))}
      </div>
    </DndContext>
  )
}
