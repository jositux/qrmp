"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Search, Loader2, CircleCheck, DollarSign, TrendingUp } from "lucide-react"
import { formatCurrency, formatDateAR } from "@/lib/format"

interface ReceivedPayment {
  id: string
  nombre: string
  monto: number
  descripcion: string | null
  paid_at: string
  payment_method: string | null
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Tarjeta crédito",
  debit_card: "Tarjeta débito",
  account_money: "Dinero en cuenta",
  ticket: "Efectivo",
  bank_transfer: "Transferencia",
  atm: "Cajero",
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  credit_card: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  debit_card: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  account_money: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ticket: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  bank_transfer: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  atm: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

function PaymentMethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>
  const label = PAYMENT_METHOD_LABELS[method] ?? method
  const color = PAYMENT_METHOD_COLORS[method] ?? "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const PAGE_SIZE = 20

export default function PagosRecibidosPage() {
  const [payments, setPayments] = useState<ReceivedPayment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPayments = useCallback(async (currentPage: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        from: dateFrom,
        to: dateTo,
      })
      if (search) params.set("q", search)

      const res = await fetch(`/api/payments/received?${params}`)
      const json = await res.json()
      if (!json.error) {
        setPayments(json.data ?? [])
        setTotal(json.total ?? 0)
      }
    } catch (error) {
      console.error("Error fetching received payments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, search])

  useEffect(() => {
    setPage(1)
    fetchPayments(1)
  }, [fetchPayments])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchPayments(newPage)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalMonto = payments.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="border-1 bg-transparent shadow-none border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden py-0">
          <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total cobrado</p>
              <DollarSign className="h-3.5 w-3.5 text-[#6D58BB]" />
            </div>
            <div className="text-sm sm:text-2xl font-medium text-[#080936] dark:text-white truncate leading-none">
              {formatCurrency(totalMonto)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-1 bg-transparent shadow-none border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden py-0">
          <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Pagos recibidos</p>
              <TrendingUp className="h-3.5 w-3.5 text-[#6D58BB]" />
            </div>
            <div className="text-sm sm:text-2xl font-medium text-[#080936] dark:text-white leading-none">
              {total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Pagos recibidos
                  {total > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {total}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Pagos aprobados por MercadoPago</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {/* Date filters */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 sm:h-9 w-full sm:w-[140px] text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 sm:h-9 w-full sm:w-[140px] text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <CircleCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aún no tenés pagos recibidos</p>
                <p className="text-sm text-muted-foreground">
                  Cuando alguien complete un pago aparecerá aquí automáticamente
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{payment.nombre}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at)}</p>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(payment.monto)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <PaymentMethodBadge method={payment.payment_method} />
                      {payment.descripcion && (
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{payment.descripcion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Método de pago</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.nombre}</TableCell>
                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.monto)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(payment.paid_at)}
                        </TableCell>
                        <TableCell>
                          <PaymentMethodBadge method={payment.payment_method} />
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {payment.descripcion || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
