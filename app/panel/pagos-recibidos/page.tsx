"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Loader2, CircleCheck, Plus, X, Check, ChevronDown } from "lucide-react"
import { formatCurrency, formatDateAR } from "@/lib/format"

interface Category {
  id: string
  nombre: string
  color: string
}

interface ReceivedPayment {
  id: string
  nombre: string
  monto: number
  descripcion: string | null
  paid_at: string
  payment_method: string | null
  mp_payment_id: string | null
  category_id: string | null
  category: Category | null
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

const CATEGORY_COLORS = ["#ef4444","#f59e0b","#22c55e","#06b6d4","#6366f1","#ec4899"]

function CategoryPopover({ payment, categories, updatingCategoryId, onUpdate, onCategoryCreated }: {
  payment: ReceivedPayment
  categories: Category[]
  updatingCategoryId: string | null
  onUpdate: (paymentId: string, categoryId: string | null) => void
  onCategoryCreated: (cat: Category) => void
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newName.trim(), color: newColor }),
      })
      const data = await res.json()
      if (res.ok && data.category) {
        onCategoryCreated(data.category)
        onUpdate(payment.id, data.category.id)
        setNewName("")
        setShowNew(false)
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/70 transition-colors group">
          {payment.category ? (
            <>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: payment.category.color }} />
              <span>{payment.category.nombre}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Sin categoría</span>
          )}
          {updatingCategoryId === payment.id
            ? <Loader2 className="h-3 w-3 animate-spin ml-0.5" />
            : <ChevronDown className="h-3 w-3 ml-0.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          }
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        <button
          onClick={() => { onUpdate(payment.id, null); setOpen(false) }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          Sin categoría
          {!payment.category_id && <Check className="h-3 w-3 ml-auto" />}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { onUpdate(payment.id, cat.id); setOpen(false) }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="truncate flex-1 text-left">{cat.nombre}</span>
            {payment.category_id === cat.id && <Check className="h-3 w-3 shrink-0" />}
          </button>
        ))}
        <div className="border-t border-border mt-1 pt-1">
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva categoría
            </button>
          ) : (
            <div className="px-2 py-1.5 space-y-2">
              <input
                autoFocus
                placeholder="Nombre..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={30}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false) }}
                className="w-full text-sm bg-muted rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-1.5">
                {CATEGORY_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${newColor === c ? "ring-2 ring-offset-1 ring-primary scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={handleCreate} disabled={!newName.trim() || creating}
                  className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Crear"}
                </button>
                <button onClick={() => { setShowNew(false); setNewName("") }}
                  className="text-xs px-2 py-1 rounded hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const PAGE_SIZE = 20

export default function PagosRecibidosPage() {
  const [payments, setPayments] = useState<ReceivedPayment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (data.categories) setCategories(data.categories) })
      .catch(() => {})
  }, [])

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
      if (selectedCategoryId) params.set("category_id", selectedCategoryId)

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
  }, [dateFrom, dateTo, search, selectedCategoryId])

  useEffect(() => {
    setPage(1)
    fetchPayments(1)
  }, [fetchPayments])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchPayments(newPage)
  }

  const updatePaymentCategory = async (paymentId: string, categoryId: string | null) => {
    setUpdatingCategoryId(paymentId)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, category_id: categoryId }),
      })
      if (res.ok) {
        const cat = categoryId ? categories.find((c) => c.id === categoryId) ?? null : null
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, category_id: categoryId, category: cat } : p
          )
        )
      }
    } finally {
      setUpdatingCategoryId(null)
    }
  }

  const handleCategoryCreated = (cat: Category) => {
    setCategories((prev) =>
      [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalMonto = payments.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm border border-border/60">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Total cobrado</p>
            <div className="text-xl sm:text-2xl font-bold text-foreground truncate leading-none">
              {formatCurrency(totalMonto)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">en el período seleccionado</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border border-border/60">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Pagos recibidos</p>
            <div className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              {total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">pagos aprobados</p>
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
                  placeholder="Buscar por nombre o ID MP..."
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

            {/* Category filters */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !selectedCategoryId
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/70 text-muted-foreground"
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategoryId === cat.id
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/70 text-muted-foreground"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.nombre}
                  </button>
                ))}
              </div>
            )}
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
                    <div className="flex items-center justify-between">
                      <CategoryPopover
                        payment={payment}
                        categories={categories}
                        updatingCategoryId={updatingCategoryId}
                        onUpdate={updatePaymentCategory}
                        onCategoryCreated={handleCategoryCreated}
                      />
                      {payment.mp_payment_id && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono">MP# {payment.mp_payment_id}</p>
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
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-muted-foreground">ID MP</TableHead>
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
                        <TableCell>
                          <CategoryPopover
                            payment={payment}
                            categories={categories}
                            updatingCategoryId={updatingCategoryId}
                            onUpdate={updatePaymentCategory}
                            onCategoryCreated={handleCategoryCreated}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {payment.descripcion || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground/60">
                          {payment.mp_payment_id || "-"}
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
