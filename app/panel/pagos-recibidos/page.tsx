"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Loader2, CircleCheck, Plus, X, Check, ChevronDown, Copy, Eye, Download, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from "xlsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDateAR } from "@/lib/format"

interface Category {
  id: string
  nombre: string
  color: string
}

interface Viajante {
  id: string
  dni: string
  nombre: string
}

interface CiudadLookup { id: string; nombre: string }
interface RutaLookup { id: string; numero: number; nombre: string; ciudad_id: string | null }
interface ViajanteLookup { id: string; nombre: string; ruta_id: string | null }

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
  viajante_id: string | null
  viajante: Viajante | null
  remito: string | null
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={handleCopy} className="ml-0.5 p-0.5 rounded hover:bg-muted transition-colors">
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? "Copiado" : "Copiar"}</TooltipContent>
    </Tooltip>
  )
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
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
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
      } else {
        setCreateError(data.error ?? "Ya existe la categoría")
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
            : <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
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
                onChange={(e) => { setNewName(e.target.value); setCreateError(null) }}
                maxLength={30}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false) }}
                className="w-full text-sm bg-muted rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
              />
              {createError && (
                <p className="text-xs text-destructive">{createError}</p>
              )}
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
                <button onClick={() => { setShowNew(false); setNewName(""); setCreateError(null) }}
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
  const [ciudades, setCiudades] = useState<CiudadLookup[]>([])
  const [rutas, setRutas] = useState<RutaLookup[]>([])
  const [viajantes, setViajantes] = useState<ViajanteLookup[]>([])
  const [filterCiudadId, setFilterCiudadId] = useState<string | null>(null)
  const [filterRutaId, setFilterRutaId] = useState<string | null>(null)
  const [filterViajanteId, setFilterViajanteId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<ReceivedPayment | null>(null)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => { if (d.categories) setCategories(d.categories) }).catch(() => {})
    fetch("/api/ciudades").then(r => r.json()).then(d => { if (d.ciudades) setCiudades(d.ciudades) }).catch(() => {})
    fetch("/api/rutas").then(r => r.json()).then(d => { if (d.rutas) setRutas(d.rutas) }).catch(() => {})
    fetch("/api/viajantes").then(r => r.json()).then(d => { if (d.viajantes) setViajantes(d.viajantes) }).catch(() => {})
  }, [])

  // Resolve effective viajante IDs from filter selections
  const effectiveViajanteIds = (() => {
    if (filterViajanteId) return [filterViajanteId]
    if (filterRutaId) return viajantes.filter(v => v.ruta_id === filterRutaId).map(v => v.id)
    if (filterCiudadId) {
      const rutaIds = new Set(rutas.filter(r => r.ciudad_id === filterCiudadId).map(r => r.id))
      return viajantes.filter(v => v.ruta_id && rutaIds.has(v.ruta_id)).map(v => v.id)
    }
    return null
  })()

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
      if (effectiveViajanteIds?.length) params.set("viajante_ids", effectiveViajanteIds.join(","))

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, search, selectedCategoryId, filterViajanteId, filterRutaId, filterCiudadId, viajantes, rutas])

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

  const exportToExcel = () => {
    const rows = payments.map((p) => ({
      Nombre: p.nombre,
      Monto: p.monto,
      "Fecha de pago": formatDateTime(p.paid_at),
      "Método de pago": PAYMENT_METHOD_LABELS[p.payment_method || ""] || p.payment_method || "",
      Categoría: p.category?.nombre || "",
      Descripción: p.descripcion || "",
      "ID MP": p.mp_payment_id || "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Pagados")
    XLSX.writeFile(wb, "pagos-recibidos.xlsx")
  }

  return (
    <TooltipProvider delayDuration={300}>
    <>
    {/* Detail Dialog */}
    <Dialog open={!!selectedPayment} onOpenChange={(open) => { if (!open) setSelectedPayment(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles del pago</DialogTitle>
          <DialogDescription>
            {selectedPayment && formatDateTime(selectedPayment.paid_at)}
          </DialogDescription>
        </DialogHeader>
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                <p className="font-medium">{selectedPayment.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monto</p>
                <p className="font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(selectedPayment.monto)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Método de pago</p>
                <PaymentMethodBadge method={selectedPayment.payment_method} />
              </div>
              {selectedPayment.category && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Categoría</p>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-background">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPayment.category.color }} />
                    {selectedPayment.category.nombre}
                  </span>
                </div>
              )}
              {selectedPayment.descripcion && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-sm">{selectedPayment.descripcion}</p>
                </div>
              )}
              {selectedPayment.mp_payment_id && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ID MercadoPago</p>
                  <span className="inline-flex items-center gap-1 font-mono text-sm">
                    {selectedPayment.mp_payment_id}
                    <CopyButton text={selectedPayment.mp_payment_id} />
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

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
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Pagados</p>
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
                  Pagados
                  {total > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {total}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Pagos aprobados por MercadoPago</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, remito o ID MP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportToExcel} disabled={payments.length === 0} className="shrink-0">
                  <Download className="h-4 w-4 mr-1.5" />
                  Excel
                </Button>
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

            {/* Ciudad / Ruta / Viajante filters */}
            {(ciudades.length > 0 || rutas.length > 0 || viajantes.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                {ciudades.length > 0 && (
                  <Select
                    value={filterCiudadId ?? "__all__"}
                    onValueChange={(v) => { setFilterCiudadId(v === "__all__" ? null : v); setFilterRutaId(null); setFilterViajanteId(null) }}
                  >
                    <SelectTrigger className="h-7 text-xs w-[140px]">
                      <SelectValue placeholder="Ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las ciudades</SelectItem>
                      {ciudades.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {rutas.length > 0 && (
                  <Select
                    value={filterRutaId ?? "__all__"}
                    onValueChange={(v) => { setFilterRutaId(v === "__all__" ? null : v); setFilterViajanteId(null) }}
                  >
                    <SelectTrigger className="h-7 text-xs w-[150px]">
                      <SelectValue placeholder="Ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las rutas</SelectItem>
                      {(filterCiudadId ? rutas.filter(r => r.ciudad_id === filterCiudadId) : rutas).map(r => (
                        <SelectItem key={r.id} value={r.id}>#{r.numero} {r.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {viajantes.length > 0 && (
                  <Select
                    value={filterViajanteId ?? "__all__"}
                    onValueChange={(v) => setFilterViajanteId(v === "__all__" ? null : v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[160px]">
                      <SelectValue placeholder="Viajante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los viajantes</SelectItem>
                      {(filterRutaId
                        ? viajantes.filter(v => v.ruta_id === filterRutaId)
                        : filterCiudadId
                          ? viajantes.filter(v => { const ruta = rutas.find(r => r.id === v.ruta_id); return ruta?.ciudad_id === filterCiudadId })
                          : viajantes
                      ).map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {(filterCiudadId || filterRutaId || filterViajanteId) && (
                  <button
                    onClick={() => { setFilterCiudadId(null); setFilterRutaId(null); setFilterViajanteId(null) }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />Limpiar
                  </button>
                )}
              </div>
            )}

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
                    className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 pb-3">
                      <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                        <p className="font-semibold truncate">{payment.nombre}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at)}</p>
                          {payment.remito && (
                            <span className="text-xs text-muted-foreground">· Remito {payment.remito}</span>
                          )}
                          {payment.viajante && (
                            <span className="text-xs text-muted-foreground">· {payment.viajante.nombre}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400 shrink-0">
                        {formatCurrency(payment.monto)}
                      </p>
                    </div>

                    {/* Estado + ID MP + descripción */}
                    <div className="px-4 pb-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CircleCheck className="h-3 w-3" />
                          Pagado
                        </span>
                        {payment.mp_payment_id && (
                          <span className="inline-flex items-center gap-0.5 font-mono text-xs text-muted-foreground">
                            {payment.mp_payment_id}
                            <CopyButton text={payment.mp_payment_id} />
                          </span>
                        )}
                      </div>
                      {payment.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{payment.descripcion}</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/20">
                      <CategoryPopover
                        payment={payment}
                        categories={categories}
                        updatingCategoryId={updatingCategoryId}
                        onUpdate={updatePaymentCategory}
                        onCategoryCreated={handleCategoryCreated}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha y hora</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedPayment(payment)}>
                        <TableCell>
                          <p className="font-medium">{payment.nombre}</p>
                          {(payment.viajante || payment.remito) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[payment.viajante?.nombre, payment.remito ? `Rem. ${payment.remito}` : null].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400 tabular-nums">
                          {formatCurrency(payment.monto)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <PaymentMethodBadge method={payment.payment_method} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <CategoryPopover
                            payment={payment}
                            categories={categories}
                            updatingCategoryId={updatingCategoryId}
                            onUpdate={updatePaymentCategory}
                            onCategoryCreated={handleCategoryCreated}
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm tabular-nums">
                          {formatDateTime(payment.paid_at)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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
    </>
    </TooltipProvider>
  )
}
