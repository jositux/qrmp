"use client"

import { useState, useEffect, useCallback } from "react"
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Trash2, Loader2, TrendingUp, QrCode, DollarSign, Eye, Send, Tag, X, Plus, Calendar, Copy, Check, ExternalLink, CircleCheck, ArrowRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { formatCurrency, formatDateAR } from "@/lib/format"

interface Category {
  id: string
  nombre: string
  color: string
}

interface Payment {
  id: string
  nombre: string
  telefono: string | null
  monto: number
  descripcion: string | null
  payment_url: string | null
  category_id: string | null
  category: Category | null
  created_at: string
}

interface Stats {
  totalMonto: number
  totalPagos: number
  totalCobrado: number
  totalPagados: number
  chartData: { date: string; monto: number; acumulado: number }[]
}

export function PaymentsDashboard() {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
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
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
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
      await Promise.all([fetchPayments(), fetchStats(), fetchCategories()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchPayments, fetchStats])

  // Filtrar pagos localmente para la tabla
  const filteredPayments = allPayments.filter((payment) => {
    const matchesSearch = payment.nombre.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategoryId || payment.category_id === selectedCategoryId
    return matchesSearch && matchesCategory
  })

  const updatePaymentCategory = async (paymentId: string, categoryId: string | null) => {
    setUpdatingCategoryId(paymentId)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentId, category_id: categoryId }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? data.payment : p))
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
    <div className="space-y-6">
      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del cobro</DialogTitle>
            <DialogDescription>
              Creado el {selectedPayment && formatDate(selectedPayment.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6 animate-fade-in">
              {/* Info del pago */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                  <p className="font-medium">{selectedPayment.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monto</p>
                  <p className="font-bold text-primary text-lg">{formatCurrency(selectedPayment.monto)}</p>
                </div>
                {selectedPayment.telefono && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telefono</p>
                    <p className="font-medium">{selectedPayment.telefono}</p>
                  </div>
                )}
                {selectedPayment.descripcion && (
                  <div className={selectedPayment.telefono ? "" : "col-span-2"}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripcion</p>
                    <p className="text-sm">{selectedPayment.descripcion}</p>
                  </div>
                )}
                {selectedPayment.category && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Categoria</p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-background">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: selectedPayment.category.color }}
                      />
                      {selectedPayment.category.nombre}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {selectedPayment.payment_url && (
                <div className="flex flex-col items-center">
                  <div className="relative bg-white p-4 rounded-xl">
                    {!qrLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-xl z-10">
                        <div className="relative">
                          <div className="w-10 h-10 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                          <QrCode className="absolute inset-0 m-auto w-4 h-4 text-primary/50" />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground animate-pulse">Cargando QR...</p>
                      </div>
                    )}
                    <img
                      src={getQrUrl(selectedPayment.payment_url)}
                      alt="QR Code"
                      className={`w-[180px] h-[180px] transition-all duration-500 ${qrLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        }`}
                      onLoad={() => setQrLoaded(true)}
                    />
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedPayment.payment_url && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(selectedPayment.payment_url!)}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar enlace
                      </>
                    )}
                  </Button>
                )}
                {selectedPayment.payment_url && (
                  <Button
                    className="flex-1"
                    onClick={() => window.open(selectedPayment.payment_url!, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir enlace
                  </Button>
                )}
                {selectedPayment.telefono && selectedPayment.payment_url && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white border-0"
                    onClick={() => {
                      sendToWhatsApp(selectedPayment)
                      setSelectedPayment(null)
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Total Solicitado */}
        <Card className="border-1 bg-transparent shadow-none border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden py-0">
          <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Solicitado</p>
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-sm sm:text-2xl font-medium text-foreground truncate leading-none">
              {formatCurrency(stats?.totalMonto || 0)}
            </div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">{stats?.totalPagos || 0} QRs generados</p>
          </CardContent>
        </Card>

        {/* Cobrado */}
        <Link href="/panel/pagos-recibidos">
          <Card className="border-1 bg-transparent shadow-none border-green-200 dark:border-green-900/50 rounded-[20px] overflow-hidden py-0 cursor-pointer hover:border-green-400 dark:hover:border-green-700 transition-colors">
            <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] sm:text-sm font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">Cobrado</p>
                <CircleCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-sm sm:text-2xl font-medium text-green-700 dark:text-green-400 truncate leading-none">
                {formatCurrency(stats?.totalCobrado || 0)}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <p className="text-[9px] sm:text-xs text-green-600/70 dark:text-green-500/70">{stats?.totalPagados || 0} pagos aprobados</p>
                <ArrowRight className="h-2.5 w-2.5 text-green-600/70 dark:text-green-500/70" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* QR Generados */}
        <Card className="border-1 bg-transparent shadow-none border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden py-0">
          <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">QRs</p>
              <QrCode className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-sm sm:text-2xl font-medium text-foreground leading-none">
              {stats?.totalPagos || 0}
            </div>
          </CardContent>
        </Card>

        {/* Promedio */}
        <Card className="border-1 bg-transparent shadow-none border-gray-200 dark:border-gray-800 rounded-[20px] overflow-hidden py-0">
          <CardContent className="py-0 px-3 h-16 sm:h-24 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Promedio</p>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-sm sm:text-2xl font-medium text-foreground truncate leading-none">
              {formatCurrency(stats?.totalPagos ? stats.totalMonto / stats.totalPagos : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Monto acumulado</CardTitle>
                <CardDescription>
                  Evolucion de cobros solicitados
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm text-muted-foreground">{formatChartDate(payload[0].payload.date)}</p>
                          <p className="text-sm font-medium">Dia: {formatCurrency(payload[0].payload.monto)}</p>
                          <p className="text-sm font-bold text-sky-500">Acumulado: {formatCurrency(payload[0].payload.acumulado)}</p>
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
                <CardTitle>Historial de cobros</CardTitle>
                <CardDescription>Todos los QR generados</CardDescription>
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
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Filtrar por:
              </span>
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className="h-7 text-xs"
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="h-7 text-xs gap-1.5"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.nombre}
                </Button>
              ))}
              {selectedCategoryId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategoryId(null)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
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
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{payment.nombre}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(payment.monto)}</p>
                    </div>
                    {payment.category && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: payment.category.color }}
                        />
                        {payment.category.nombre}
                      </span>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => handleOpenPaymentDetails(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver QR
                      </Button>
                      {payment.telefono && payment.payment_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 bg-[#25D366] hover:bg-[#1da851] text-white border-0"
                          onClick={() => sendToWhatsApp(payment)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setPaymentToDelete(payment)}
                        disabled={deletingId === payment.id}
                      >
                        {deletingId === payment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
                      <TableHead>Telefono</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.telefono || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.monto)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {payment.category ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: payment.category.color }}
                              />
                              {payment.category.nombre}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {payment.descripcion || "-"}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setPaymentToDelete(payment)}
                              disabled={deletingId === payment.id}
                            >
                              {deletingId === payment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
