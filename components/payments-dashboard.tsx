"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Trash2, Loader2, TrendingUp, QrCode, DollarSign, Eye, Send, Tag, X, Plus, Calendar, Copy, Check, ExternalLink, CircleCheck, ArrowRight, ChevronDown, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
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

interface Payment {
  id: string
  nombre: string
  telefono: string | null
  monto: number
  descripcion: string | null
  payment_url: string | null
  category_id: string | null
  category: Category | null
  viajante_id: string | null
  viajante: Viajante | null
  remito: string | null
  created_at: string
  status: string | null
  mp_payment_id: string | null
}

interface Stats {
  totalMonto: number
  totalPagos: number
  totalCobrado: number
  totalPagados: number
  chartData: { date: string; monto: number; acumulado: number; cobrado: number; acumuladoCobrado: number }[]
}

function StatusBadge({ status, mpPaymentId }: { status: string | null; mpPaymentId: string | null }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CircleCheck className="h-3 w-3" />
        Pagado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400" />
      Pendiente
    </span>
  )
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
  payment: Payment
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

export function PaymentsDashboard() {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ciudades, setCiudades] = useState<CiudadLookup[]>([])
  const [rutas, setRutas] = useState<RutaLookup[]>([])
  const [viajantesLookup, setViajantesLookup] = useState<ViajanteLookup[]>([])
  const [filterCiudadId, setFilterCiudadId] = useState<string | null>(null)
  const [filterRutaId, setFilterRutaId] = useState<string | null>(null)
  const [filterViajanteId, setFilterViajanteId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [listFading, setListFading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeletePending, setBulkDeletePending] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/payments")
      const data = await res.json()
      if (data.payments) {
        setAllPayments(data.payments)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchLookups = async () => {
    const [c, r, v] = await Promise.all([
      fetch("/api/ciudades").then(r => r.json()).catch(() => ({})),
      fetch("/api/rutas").then(r => r.json()).catch(() => ({})),
      fetch("/api/viajantes").then(r => r.json()).catch(() => ({})),
    ])
    if (c.ciudades) setCiudades(c.ciudades)
    if (r.rutas) setRutas(r.rutas)
    if (v.viajantes) setViajantesLookup(v.viajantes)
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/stats?from=${dateFrom}&to=${dateTo}`)
      const data = await res.json()
      if (!data.error) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchPayments(), fetchStats(), fetchCategories(), fetchLookups()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchPayments, fetchStats])

  useEffect(() => {
    setListFading(true)
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setListFading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  const effectiveViajanteIds = useMemo((): Set<string> | null => {
    if (filterViajanteId) return new Set([filterViajanteId])
    if (filterRutaId) {
      const ids = viajantesLookup.filter(v => v.ruta_id === filterRutaId).map(v => v.id)
      return ids.length ? new Set(ids) : null
    }
    if (filterCiudadId) {
      const rutaIds = new Set(rutas.filter(r => r.ciudad_id === filterCiudadId).map(r => r.id))
      const ids = viajantesLookup.filter(v => v.ruta_id && rutaIds.has(v.ruta_id)).map(v => v.id)
      return ids.length ? new Set(ids) : null
    }
    return null
  }, [filterViajanteId, filterRutaId, filterCiudadId, viajantesLookup, rutas])

  // Filtrar pagos localmente para la tabla
  const filteredPayments = allPayments
    .filter((payment) => {
      const q = debouncedSearch.toLowerCase()
      const matchesSearch = !q ||
        payment.nombre.toLowerCase().includes(q) ||
        (payment.remito?.toLowerCase().includes(q)) ||
        (payment.viajante?.nombre.toLowerCase().includes(q))
      const matchesCategory = !selectedCategoryId || payment.category_id === selectedCategoryId
      const matchesStatus =
        !selectedStatus ||
        (selectedStatus === "approved" && payment.status === "approved") ||
        (selectedStatus === "pending" && payment.status !== "approved")
      const matchesViajante = !effectiveViajanteIds ||
        (payment.viajante_id ? effectiveViajanteIds.has(payment.viajante_id) : false)
      return matchesSearch && matchesCategory && matchesStatus && matchesViajante
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const exportToExcel = () => {
    const rows = filteredPayments.map((p) => ({
      Nombre: p.nombre,
      Monto: p.monto,
      Estado: p.status === "approved" ? "Pagado" : "Pendiente",
      Teléfono: p.telefono || "",
      Categoría: p.category?.nombre || "",
      "ID MP": p.mp_payment_id || "",
      Fecha: formatDateAR(p.created_at),
      "Link de pago": p.payment_url || "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cobros")
    XLSX.writeFile(wb, "cobros.xlsx")
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
        setAllPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, category_id: categoryId, category: cat } : p
          )
        )
      }
    } catch (error) {
      console.error("Error updating payment category:", error)
    } finally {
      setUpdatingCategoryId(null)
    }
  }

  const confirmDelete = async () => {
    if (!paymentToDelete) return

    setDeletingId(paymentToDelete.id)
    setPaymentToDelete(null)
    try {
      const res = await fetch(`/api/payments?id=${paymentToDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setAllPayments((prev) => prev.filter((p) => p.id !== paymentToDelete.id))
        fetchStats()
      }
    } catch (error) {
      console.error("Error deleting payment:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const pendingIds = filteredPayments.filter((p) => p.status !== "approved").map((p) => p.id)
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingIds))
    }
  }

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true)
    setBulkDeletePending(false)
    try {
      const ids = Array.from(selectedIds).join(",")
      const res = await fetch(`/api/payments?ids=${ids}`, { method: "DELETE" })
      if (res.ok) {
        setAllPayments((prev) => prev.filter((p) => !selectedIds.has(p.id)))
        setSelectedIds(new Set())
        fetchStats()
      }
    } catch (error) {
      console.error("Error bulk deleting payments:", error)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const getQrUrl = (paymentUrl: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl)}`
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenPaymentDetails = (payment: Payment) => {
    setQrLoaded(false)
    setCopied(false)
    setSelectedPayment(payment)
  }

  const sendToWhatsApp = (payment: Payment) => {
    if (!payment.payment_url || !payment.telefono) return
    const message = `Hola ${payment.nombre}! Te envio el link de pago por ${formatCurrency(payment.monto)}${payment.descripcion ? ` - ${payment.descripcion}` : ""}: ${payment.payment_url}`
    const cleanPhone = payment.telefono.replace(/[\s\-\(\)]/g, "")
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const formatDate = (dateStr: string) => formatDateAR(dateStr)

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-6">
      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del cobro</DialogTitle>
            <DialogDescription>
              Creado el {selectedPayment && formatDate(selectedPayment.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-3 animate-fade-in">
              {/* Info del pago */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-muted/50 rounded-xl text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cliente</p>
                  <p className="font-medium">{selectedPayment.nombre}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Monto</p>
                  <p className="font-bold text-primary text-base">{formatCurrency(selectedPayment.monto)}</p>
                </div>
                <div>
                  {selectedPayment.telefono && (
                    <>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Telefono</p>
                      <p className="font-medium">{selectedPayment.telefono}</p>
                    </>
                  )}
                </div>
                <div>
                  {selectedPayment.category && (
                    <>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Categoria</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-background">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedPayment.category.color }} />
                        {selectedPayment.category.nombre}
                      </span>
                    </>
                  )}
                </div>
                {selectedPayment.descripcion && (
                  <div className="col-span-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Descripcion</p>
                    <p className="text-sm">{selectedPayment.descripcion}</p>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {selectedPayment.payment_url && (
                <div className="flex justify-center">
                  <div className="relative bg-white p-3 rounded-xl">
                    {!qrLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-xl z-10">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                          <QrCode className="absolute inset-0 m-auto w-3.5 h-3.5 text-primary/50" />
                        </div>
                      </div>
                    )}
                    <img
                      src={getQrUrl(selectedPayment.payment_url)}
                      alt="QR Code"
                      className={`w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] transition-all duration-500 ${qrLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                      onLoad={() => setQrLoaded(true)}
                    />
                  </div>
                </div>
              )}

              {/* Acciones — iconos solos en mobile, texto en sm+ */}
              {selectedPayment.payment_url && (
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => copyToClipboard(selectedPayment.payment_url!)} title="Copiar enlace">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-2">{copied ? "Copiado" : "Copiar"}</span>
                  </Button>
                  <Button onClick={() => window.open(selectedPayment.payment_url!, "_blank")} title="Abrir enlace">
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Abrir</span>
                  </Button>
                  <Button
                    className="bg-[#25D366] hover:bg-[#1da851] text-white border-0"
                    disabled={!selectedPayment.telefono}
                    title="Enviar por WhatsApp"
                    onClick={() => { sendToWhatsApp(selectedPayment); setSelectedPayment(null) }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="hidden sm:inline ml-2">WhatsApp</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeletePending} onOpenChange={setBulkDeletePending}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {selectedIds.size} cobro{selectedIds.size > 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente los {selectedIds.size} cobros seleccionados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar {selectedIds.size} cobro{selectedIds.size > 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pago</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de eliminar el pago de <span className="font-semibold">{paymentToDelete?.nombre}</span> por{" "}
              <span className="font-semibold">{paymentToDelete ? formatCurrency(paymentToDelete.monto) : ""}</span>?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Solicitado */}
        <Card className="shadow-sm border border-border/60">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Solicitado</p>
            <div className="text-xl sm:text-2xl font-bold text-foreground truncate leading-none">
              {formatCurrency(stats?.totalMonto || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">{stats?.totalPagos || 0} QRs generados</p>
          </CardContent>
        </Card>

        {/* Cobrado */}
        <Link href="/panel/pagos-recibidos">
          <Card className="shadow-sm border border-border/60 cursor-pointer hover:shadow-md transition-shadow group h-full">
            <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Cobrado</p>
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate leading-none">
                {formatCurrency(stats?.totalCobrado || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{stats?.totalPagados || 0} pagos aprobados</p>
            </CardContent>
          </Card>
        </Link>

        {/* Ticket promedio */}
        <Card className="shadow-sm border border-border/60">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Ticket promedio</p>
            <div className="text-xl sm:text-2xl font-bold text-foreground truncate leading-none">
              {formatCurrency(stats?.totalPagos ? stats.totalMonto / stats.totalPagos : 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">por cobro generado</p>
          </CardContent>
        </Card>

        {/* Tasa de conversión */}
        <Card className="shadow-sm border border-border/60">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-3.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Conversión</p>
            <div className="text-xl sm:text-2xl font-bold text-foreground truncate leading-none">
              {stats?.totalPagos
                ? `${Math.round((stats.totalPagados / stats.totalPagos) * 100)}%`
                : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {stats?.totalPagados || 0} de {stats?.totalPagos || 0} cobros pagados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Evolución de cobros</CardTitle>
                <CardDescription>
                  Solicitado vs cobrado acumulado
                </CardDescription>
              </div>
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
            {/* Legend + periodo activo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-500 inline-block rounded" />
                  Solicitado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
                  Cobrado
                </span>
              </div>
              <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {new Date(dateFrom).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                {" — "}
                {new Date(dateTo).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">{formatChartDate(d.date)}</p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <span className="text-xs text-muted-foreground">Solicitado:</span>
                            <span className="text-xs font-bold text-sky-500">{formatCurrency(d.acumulado)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs text-muted-foreground">Cobrado:</span>
                            <span className="text-xs font-bold text-emerald-500">{formatCurrency(d.acumuladoCobrado)}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#colorMonto)"
                />
                <Area
                  type="monotone"
                  dataKey="acumuladoCobrado"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorCobrado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Historial de cobros
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {filteredPayments.length}{filteredPayments.length !== allPayments.length ? ` de ${allPayments.length}` : ""}
                  </span>
                </CardTitle>
                <CardDescription>Todos los QR generados</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, remito o viajante..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-sm placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={exportToExcel} disabled={filteredPayments.length === 0} className="shrink-0">
                  <Download className="h-4 w-4 mr-1.5" />
                  Excel
                </Button>
              </div>
            </div>
            {/* Filters — una sola fila con separador */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Estado */}
              <span className="text-xs text-muted-foreground hidden sm:block">Estado:</span>
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(null)}
                className="h-7 text-xs"
              >
                Todos
              </Button>
              <Button
                variant={selectedStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(selectedStatus === "pending" ? null : "pending")}
                className="h-7 text-xs gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Pendiente
              </Button>
              <Button
                variant={selectedStatus === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(selectedStatus === "approved" ? null : "approved")}
                className="h-7 text-xs gap-1.5"
              >
                <CircleCheck className="h-3 w-3 text-green-500" />
                Pagado
              </Button>

              {/* Separador */}
              {categories.length > 0 && (
                <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
              )}

              {/* Categorías */}
              {categories.length > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  <Tag className="h-3 w-3 inline mr-1" />
                </span>
              )}
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                  className="h-7 text-xs gap-1.5"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.nombre}
                </Button>
              ))}
              {(selectedCategoryId || selectedStatus) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedCategoryId(null); setSelectedStatus(null) }}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Ciudad / Ruta / Viajante */}
            {(ciudades.length > 0 || rutas.length > 0 || viajantesLookup.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">Ruta:</span>
                {ciudades.length > 0 && (
                  <Select value={filterCiudadId ?? "__all__"} onValueChange={(v) => { setFilterCiudadId(v === "__all__" ? null : v); setFilterRutaId(null); setFilterViajanteId(null) }}>
                    <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las ciudades</SelectItem>
                      {ciudades.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {rutas.length > 0 && (
                  <Select value={filterRutaId ?? "__all__"} onValueChange={(v) => { setFilterRutaId(v === "__all__" ? null : v); setFilterViajanteId(null) }}>
                    <SelectTrigger className="h-7 text-xs w-[150px]"><SelectValue placeholder="Ruta" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas las rutas</SelectItem>
                      {(filterCiudadId ? rutas.filter(r => r.ciudad_id === filterCiudadId) : rutas).map(r => (
                        <SelectItem key={r.id} value={r.id}>#{r.numero} {r.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {viajantesLookup.length > 0 && (
                  <Select value={filterViajanteId ?? "__all__"} onValueChange={(v) => setFilterViajanteId(v === "__all__" ? null : v)}>
                    <SelectTrigger className="h-7 text-xs w-[160px]"><SelectValue placeholder="Viajante" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los viajantes</SelectItem>
                      {(filterRutaId
                        ? viajantesLookup.filter(v => v.ruta_id === filterRutaId)
                        : filterCiudadId
                          ? viajantesLookup.filter(v => { const r = rutas.find(r => r.id === v.ruta_id); return r?.ciudad_id === filterCiudadId })
                          : viajantesLookup
                      ).map(v => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {(filterCiudadId || filterRutaId || filterViajanteId) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterCiudadId(null); setFilterRutaId(null); setFilterViajanteId(null) }} className="h-7 text-xs text-muted-foreground">
                    <X className="h-3 w-3 mr-1" />Limpiar
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="mx-6 mb-2 flex items-center justify-between gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5">
            <span className="text-sm font-medium text-primary">
              {selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="h-3 w-3 mr-1" />
                Deseleccionar
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-destructive text-white hover:bg-destructive/90"
                onClick={() => setBulkDeletePending(true)}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Eliminar {selectedIds.size}
              </Button>
            </div>
          </div>
        )}
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              {search || selectedCategoryId ? (
                <p className="text-muted-foreground">No se encontraron resultados</p>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Aun no has generado ningun QR</p>
                    <p className="text-sm text-muted-foreground">Crea tu primer cobro y empieza a recibir pagos</p>
                  </div>
                  <Button asChild className="mt-2">
                    <Link href="/panel/cobros">
                      <Plus className="w-4 h-4 mr-2" />
                      Comienza ahora
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className={`transition-opacity duration-200 ${listFading ? "opacity-0" : "opacity-100"}`}>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-4 rounded-xl border bg-card/50 space-y-3 transition-colors ${
                      selectedIds.has(payment.id)
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(payment.id)}
                          onCheckedChange={() => toggleSelect(payment.id)}
                          disabled={payment.status === "approved"}
                          className="mt-0.5"
                        />
                        <div className="space-y-1">
                          <p className="font-medium">{payment.nombre}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                            {payment.remito && (
                              <span className="text-xs text-muted-foreground">· Remito {payment.remito}</span>
                            )}
                            {payment.viajante && (
                              <span className="text-xs text-muted-foreground">· {payment.viajante.nombre}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(payment.monto)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={payment.status} mpPaymentId={payment.mp_payment_id} />
                      <CategoryPopover
                        payment={payment}
                        categories={categories}
                        updatingCategoryId={updatingCategoryId}
                        onUpdate={updatePaymentCategory}
                        onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleOpenPaymentDetails(payment)}
                          title="Ver QR"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.telefono && payment.payment_url && (
                          <Button
                            size="icon"
                            className="h-9 w-9 bg-[#25D366] hover:bg-[#1da851] text-white border-0"
                            onClick={() => sendToWhatsApp(payment)}
                            title="WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </Button>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive disabled:opacity-30"
                              onClick={() => setPaymentToDelete(payment)}
                              disabled={deletingId === payment.id || payment.status === "approved"}
                            >
                              {deletingId === payment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {payment.status === "approved" && (
                          <TooltipContent>No se puede eliminar un cobro pagado</TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            filteredPayments.filter((p) => p.status !== "approved").length > 0 &&
                            selectedIds.size === filteredPayments.filter((p) => p.status !== "approved").length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Seleccionar todos los pendientes"
                        />
                      </TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden lg:table-cell">Remito</TableHead>
                      <TableHead className="hidden lg:table-cell">Viajante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">ID MP</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className={selectedIds.has(payment.id) ? "bg-primary/5" : ""}
                      >
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Checkbox
                                  checked={selectedIds.has(payment.id)}
                                  onCheckedChange={() => toggleSelect(payment.id)}
                                  disabled={payment.status === "approved"}
                                />
                              </span>
                            </TooltipTrigger>
                            {payment.status === "approved" && (
                              <TooltipContent>No se puede eliminar un cobro pagado</TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell className="font-medium">{payment.nombre}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {payment.remito ?? <span className="text-muted-foreground/40">-</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {payment.viajante?.nombre ?? <span className="text-muted-foreground/40">-</span>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} mpPaymentId={payment.mp_payment_id} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {payment.mp_payment_id ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                              {payment.mp_payment_id}
                              <CopyButton text={payment.mp_payment_id} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.telefono || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.monto)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <CategoryPopover
                            payment={payment}
                            categories={categories}
                            updatingCategoryId={updatingCategoryId}
                            onUpdate={updatePaymentCategory}
                            onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenPaymentDetails(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-30"
                                    onClick={() => setPaymentToDelete(payment)}
                                    disabled={deletingId === payment.id || payment.status === "approved"}
                                  >
                                    {deletingId === payment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {payment.status === "approved" && (
                                <TooltipContent>No se puede eliminar un cobro pagado</TooltipContent>
                              )}
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  )
}
