import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber } from '@/lib/format'

describe('formatCurrency', () => {
  it('formatea correctamente un numero entero', () => {
    expect(formatCurrency(1500)).toBe('$ 1.500,00')
  })

  it('formatea correctamente un numero con decimales', () => {
    expect(formatCurrency(1234.56)).toBe('$ 1.234,56')
  })

  it('formatea correctamente el cero', () => {
    expect(formatCurrency(0)).toBe('$ 0,00')
  })

  it('formatea correctamente numeros grandes', () => {
    expect(formatCurrency(1000000)).toBe('$ 1.000.000,00')
  })

  it('formatea correctamente numeros negativos', () => {
    expect(formatCurrency(-500)).toBe('-$ 500,00')
  })
})

describe('formatNumber', () => {
  it('formatea correctamente un numero entero', () => {
    expect(formatNumber(1500)).toBe('1.500')
  })

  it('formatea correctamente numeros grandes', () => {
    expect(formatNumber(1000000)).toBe('1.000.000')
  })

  it('formatea correctamente el cero', () => {
    expect(formatNumber(0)).toBe('0')
  })
})
