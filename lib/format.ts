/**
 * Formatea un número como moneda argentina (estilo MercadoPago)
 * Ejemplo: 1500.50 -> "$ 1.500,50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea un número con separador de miles (punto) y decimales (coma)
 * Ejemplo: 1500.50 -> "1.500,50"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea una fecha en formato argentino DD/MM/YYYY
 * Ejemplo: "2024-03-15T10:30:00" -> "15/03/2024"
 */
export function formatDateAR(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formatea una fecha en formato corto DD/MM
 * Ejemplo: "2024-03-15T10:30:00" -> "15/03"
 */
export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  })
}
