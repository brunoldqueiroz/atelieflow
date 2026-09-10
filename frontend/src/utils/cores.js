/**
 * Mapeia cor_badge (string curta vinda da API) para classes Tailwind completas.
 * Classes precisam ser literais para o Tailwind compilá-las (sem interpolação dinâmica).
 */
const CORES = {
  slate: {
    borda: 'border-slate-300',
    fundo: 'bg-slate-100',
    texto: 'text-slate-700',
    ponto: 'bg-slate-500',
  },
  amber: {
    borda: 'border-amber-300',
    fundo: 'bg-amber-100',
    texto: 'text-amber-700',
    ponto: 'bg-amber-500',
  },
  blue: {
    borda: 'border-blue-300',
    fundo: 'bg-blue-100',
    texto: 'text-blue-700',
    ponto: 'bg-blue-500',
  },
  emerald: {
    borda: 'border-emerald-300',
    fundo: 'bg-emerald-100',
    texto: 'text-emerald-700',
    ponto: 'bg-emerald-500',
  },
  violet: {
    borda: 'border-violet-300',
    fundo: 'bg-violet-100',
    texto: 'text-violet-700',
    ponto: 'bg-violet-500',
  },
  red: {
    borda: 'border-red-300',
    fundo: 'bg-red-100',
    texto: 'text-red-700',
    ponto: 'bg-red-500',
  },
}

export function classesCor(cor) {
  return CORES[cor] ?? CORES.slate
}
