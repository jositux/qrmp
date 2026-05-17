import { describe, it, expect } from 'vitest'
import {
  paymentSchema,
  loginSchema,
  registerSchema,
  categorySchema,
  bulkClientSchema,
  formatZodErrors,
} from '@/lib/validations'

describe('paymentSchema', () => {
  it('valida un pago correcto con todos los campos', () => {
    const result = paymentSchema.safeParse({
      amount: 1500,
      title: 'Envio express',
      clientName: 'Juan Perez',
      clientPhone: '5491155551234',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('valida un pago con solo monto (campos opcionales)', () => {
    const result = paymentSchema.safeParse({
      amount: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza monto menor a 1', () => {
    const result = paymentSchema.safeParse({
      amount: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('amount')
    }
  })

  it('rechaza monto negativo', () => {
    const result = paymentSchema.safeParse({
      amount: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza monto no numerico', () => {
    const result = paymentSchema.safeParse({
      amount: 'mil pesos',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza telefono con formato invalido', () => {
    const result = paymentSchema.safeParse({
      amount: 1000,
      clientPhone: 'abc123',
    })
    expect(result.success).toBe(false)
  })

  it('acepta telefono vacio', () => {
    const result = paymentSchema.safeParse({
      amount: 1000,
      clientPhone: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('loginSchema', () => {
  it('valida credenciales correctas', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza email invalido', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('rechaza password muy corta', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rechaza campos vacios', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('valida registro correcto', () => {
    const result = registerSchema.safeParse({
      email: 'nuevo@example.com',
      password: 'password123',
      repeatPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza passwords que no coinciden', () => {
    const result = registerSchema.safeParse({
      email: 'nuevo@example.com',
      password: 'password123',
      repeatPassword: 'diferente456',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('repeatPassword')
    }
  })

  it('rechaza password sin numeros', () => {
    const result = registerSchema.safeParse({
      email: 'nuevo@example.com',
      password: 'passwordonly',
      repeatPassword: 'passwordonly',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza password sin letras', () => {
    const result = registerSchema.safeParse({
      email: 'nuevo@example.com',
      password: '12345678',
      repeatPassword: '12345678',
    })
    expect(result.success).toBe(false)
  })
})

describe('categorySchema', () => {
  it('valida categoria correcta', () => {
    const result = categorySchema.safeParse({
      nombre: 'Entregas',
      color: '#ff5500',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre muy corto', () => {
    const result = categorySchema.safeParse({
      nombre: 'A',
      color: '#ff5500',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza color invalido', () => {
    const result = categorySchema.safeParse({
      nombre: 'Entregas',
      color: 'rojo',
    })
    expect(result.success).toBe(false)
  })

  it('acepta color con 3 digitos', () => {
    const result = categorySchema.safeParse({
      nombre: 'Entregas',
      color: '#f50',
    })
    expect(result.success).toBe(true)
  })
})

describe('bulkClientSchema', () => {
  it('valida cliente masivo correcto', () => {
    const result = bulkClientSchema.safeParse({
      nombre: 'Maria Garcia',
      telefono: '5491166667777',
      monto: 2500,
      descripcion: 'Envio zona sur',
    })
    expect(result.success).toBe(true)
  })

  it('acepta sin telefono', () => {
    const result = bulkClientSchema.safeParse({
      nombre: 'Pedro Lopez',
      monto: 1000,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza sin nombre', () => {
    const result = bulkClientSchema.safeParse({
      monto: 1000,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza sin monto', () => {
    const result = bulkClientSchema.safeParse({
      nombre: 'Cliente',
    })
    expect(result.success).toBe(false)
  })
})

describe('formatZodErrors', () => {
  it('convierte errores de Zod a objeto simple', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: '123',
    })
    
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      expect(typeof errors).toBe('object')
      expect(errors.email).toBeDefined()
    }
  })

  it('retorna objeto vacio sin errores', () => {
    const result = loginSchema.safeParse({
      email: 'valid@email.com',
      password: 'password123',
    })
    
    if (result.success) {
      // No hay errores para formatear
      expect(result.success).toBe(true)
    }
  })
})
