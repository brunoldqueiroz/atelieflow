import { describe, expect, it } from 'vitest'
import { formatarData, formatarMoeda, hojeISO, situacaoPrazo } from './formatacao'

describe('formatarData', () => {
  it('converte ISO para dd/mm/aaaa sem deslocamento de fuso', () => {
    expect(formatarData('2026-09-15')).toBe('15/09/2026')
  })

  it('retorna vazio para data ausente', () => {
    expect(formatarData(null)).toBe('')
    expect(formatarData('')).toBe('')
  })
})

describe('formatarMoeda', () => {
  it('formata número em Real', () => {
    expect(formatarMoeda(150)).toBe('R$\u00a0150,00')
  })

  it('aceita string decimal vinda da API', () => {
    expect(formatarMoeda('89.90')).toBe('R$\u00a089,90')
  })
})

describe('hojeISO', () => {
  it('retorna data no formato ISO aaaa-mm-dd', () => {
    expect(hojeISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('situacaoPrazo', () => {
  const hoje = '2026-09-10'

  it('data passada está atrasada', () => {
    expect(situacaoPrazo('2026-09-08', hoje)).toBe('atrasada')
  })

  it('entrega no dia é "hoje"', () => {
    expect(situacaoPrazo('2026-09-10', hoje)).toBe('hoje')
  })

  it('até dois dias à frente é urgente', () => {
    expect(situacaoPrazo('2026-09-11', hoje)).toBe('urgente')
    expect(situacaoPrazo('2026-09-12', hoje)).toBe('urgente')
  })

  it('mais de dois dias à frente está no prazo', () => {
    expect(situacaoPrazo('2026-09-13', hoje)).toBe('no_prazo')
    expect(situacaoPrazo('2026-12-01', hoje)).toBe('no_prazo')
  })
})
