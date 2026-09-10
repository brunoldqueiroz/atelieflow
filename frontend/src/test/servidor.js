import { setupServer } from 'msw/node'

/** Servidor MSW compartilhado; cada teste registra os handlers necessários. */
export const servidor = setupServer()
