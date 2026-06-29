"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  Upload,
  FileSpreadsheet,
  Send,
  Check,
  X,
  Download,
  Trash2,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import { formatCurrency } from "@/lib/format"
import { CategorySelector } from "@/components/category-selector"
import { useGeneration } from "@/contexts/generation-context"

interface ClientRow {
  id: string
  nombre: string
  telefono: string
  monto: number
  descripcion: string
  status: "pending" | "generating" | "ready" | "error" | "invalid"
  paymentUrl?: string
  dbId?: string
  error?: string
  validationError?: string
}

const ITEMS_PER_PAGE = 20

export function BulkPaymentForm() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [previewClient, setPreviewClient] = useState<ClientRow | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pagination
  const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClients = clients.slice(startIndex, endIndex)

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const MONTO_MAX = 99999999
  const NOMBRE_MAX = 30
  const DESC_MAX = 100

  const normalizeText = (text: string): string => {
    try {
      const decoded = decodeURIComponent(escape(text))
      return decoded.trim()
    } catch {
      return text.trim()
    }
  }

  const parseAmount = (raw: string): number => {
    const cleaned = String(raw).trim().replace(/[^\d.,]/g, "")
    if (!cleaned) return 0
    // Both . and , present → . is thousands separator, , is decimal (AR format: "1.500,00")
    if (cleaned.includes(".") && cleaned.includes(",")) {
      return Number(cleaned.replace(/\./g, "").replace(",", "."))
    }
    // Only comma present
    if (cleaned.includes(",")) {
      const parts = cleaned.split(",")
      // If decimal part has ≤2 digits → comma is decimal separator
      if (parts.length === 2 && parts[1].length <= 2) {
        return Number(cleaned.replace(",", "."))
      }
      return Number(cleaned.replace(/,/g, ""))
    }
    // Only dot present
    if (cleaned.includes(".")) {
      const parts = cleaned.split(".")
      // Dot as thousands separator: single dot with exactly 3 digits after (e.g., "1.500")
      if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
        return Number(cleaned.replace(".", ""))
      }
      return Number(cleaned)
    }
    return Number(cleaned)
  }

  const validateRow = (nombre: string, monto: number): string | null => {
    if (!nombre) return "Nombre vacío"
    if (monto <= 0) return "Monto debe ser mayor a 0"
    if (monto > MONTO_MAX) return `Monto supera el máximo (${MONTO_MAX.toLocaleString("es-AR")})`
    return null
  }

  const processFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: "array", codepage: 65001 })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" }) as Record<string, unknown>[]

        const parsedClients: ClientRow[] = jsonData.map((row, index) => {
          const nombre = normalizeText(String(row.nombre || row.Nombre || row.NOMBRE || row.name || row.Name || "")).slice(0, NOMBRE_MAX)
          const monto = parseAmount(String(row.monto || row.Monto || row.MONTO || row.amount || row.Amount || "0"))
          const descripcion = normalizeText(String(row.descripcion || row.Descripcion || row.DESCRIPCION || row.description || row.Description || "Pago")).slice(0, DESC_MAX)
          const telefono = String(row.telefono || row.Telefono || row.TELEFONO || row.phone || row.Phone || row.whatsapp || row.WhatsApp || "").replace(/[^\d+]/g, "")
          const validationError = validateRow(nombre, monto)
          return {
            id: `client-${index}`,
            nombre,
            telefono,
            monto,
            descripcion,
            status: validationError ? "invalid" : "pending",
            validationError: validationError ?? undefined,
          }
        })

        setClients(parsedClients)
        setCurrentPage(1)
      } catch (err) {
        console.error("Error procesando archivo:", err)
        alert("Error al leer el archivo. Verifica que sea un Excel o CSV valido.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      processFile(file)
    } else {
      alert("Por favor sube un archivo Excel (.xlsx, .xls) o CSV (.csv)")
    }
  }

  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const shouldStopRef = useRef(false)
  const { setIsGenerating } = useGeneration()

  useEffect(() => {
    if (!loading) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [loading])

  const savePaymentToDB = async (client: ClientRow, paymentUrl: string, preferenceId: string, externalReference: string): Promise<string | undefined> => {
    try {
      const res = await fetch("/api/save-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: client.nombre,
          telefono: client.telefono || null,
          monto: client.monto,
          descripcion: client.descripcion,
          payment_url: paymentUrl,
          preference_id: preferenceId,
          external_reference: externalReference,
          category_id: categoryId,
        }),
      })
      const data = await res.json()
      return data.payment?.id
    } catch (e) {
      console.error("Error saving payment:", e)
    }
  }

  const generateSinglePayment = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client || client.status === "ready") return

    setGeneratingId(clientId)
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: "generating" } : c))
    )

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: client.monto, title: client.descripcion }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al generar pago")

      const dbId = await savePaymentToDB(client, data.payment_url, data.preference_id, data.external_reference)

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId ? { ...c, status: "ready", paymentUrl: data.payment_url, dbId } : c
        )
      )
    } catch (err) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, status: "error", error: err instanceof Error ? err.message : "Error" }
            : c
        )
      )
    }

    setGeneratingId(null)
  }

  const generateAllPayments = async () => {
    shouldStopRef.current = false
    setLoading(true)
    setIsGenerating(true)

    for (let i = 0; i < clients.length; i++) {
      if (shouldStopRef.current) break
      const client = clients[i]
      if (client.status === "ready" || client.status === "invalid") continue

      setCurrentIndex(i)
      setClients((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, status: "generating" } : c))
      )

      try {
        const response = await fetch("/api/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: client.monto, title: client.descripcion }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Error al generar pago")

        const dbId = await savePaymentToDB(client, data.payment_url, data.preference_id, data.external_reference)

        setClients((prev) =>
          prev.map((c, idx) =>
            idx === i ? { ...c, status: "ready", paymentUrl: data.payment_url, dbId } : c
          )
        )
      } catch (err) {
        setClients((prev) =>
          prev.map((c, idx) =>
            idx === i
              ? { ...c, status: "error", error: err instanceof Error ? err.message : "Error" }
              : c
          )
        )
      }

      await new Promise((r) => setTimeout(r, 300))
    }

    setLoading(false)
    setCurrentIndex(null)
    setIsGenerating(false)
    shouldStopRef.current = false
  }

  const getShareMessage = (client: ClientRow) => {
    const formattedAmount = formatCurrency(client.monto)

    return [
      client.nombre ? `Hola ${client.nombre}!` : "Hola!",
      "",
      "Te envío el enlace de pago:",
      "",
      `Descripción: ${client.descripcion}`,
      `Monto: ${formattedAmount}`,
      "",
      `Pagar aquí: ${client.paymentUrl}`,
    ].join("\n")
  }

  const sendToWhatsApp = (client: ClientRow) => {
    if (!client.paymentUrl) return

    const message = encodeURIComponent(getShareMessage(client))
    const cleanPhone = client.telefono.replace(/[\s\-\(\)]/g, "")
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
  }

  const removeClient = (id: string) => {
    const client = clients.find((c) => c.id === id)
    if (client?.dbId) {
      fetch(`/api/payments?id=${client.dbId}`, { method: "DELETE" })
        .catch((e) => console.error("Error deleting payment:", e))
    }
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const clearAll = () => {
    shouldStopRef.current = true
    const dbIds = clients.filter((c) => c.dbId).map((c) => c.dbId!)
    if (dbIds.length > 0) {
      fetch(`/api/payments?ids=${dbIds.join(",")}`, { method: "DELETE" })
        .catch((e) => console.error("Error deleting payments:", e))
    }
    setClients([])
    setFileName(null)
    setCurrentPage(1)
    setLoading(false)
    setIsGenerating(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const downloadTemplate = () => {
    const template = [
      { nombre: "Juan Pérez", telefono: "5491155551234", monto: 1500, descripcion: "Servicio mensual" },
      { nombre: "María García", telefono: "5491166662345", monto: 2000, descripcion: "Consulta" },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, "plantilla_pagos.xlsx")
  }

  const readyCount = clients.filter((c) => c.status === "ready").length
  const errorCount = clients.filter((c) => c.status === "error").length
  const invalidCount = clients.filter((c) => c.status === "invalid").length
  const pendingCount = clients.filter((c) => c.status === "pending" || c.status === "error").length

  const getStatusBadge = (client: ClientRow) => {
    switch (client.status) {
      case "pending":
        return <span className="text-xs text-muted-foreground">Pendiente</span>
      case "generating":
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
      case "ready":
        return <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Listo</span>
      case "error":
        return <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Error</span>
      case "invalid":
        return (
          <span className="px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" title={client.validationError}>
            Inválido
          </span>
        )
    }
  }

  return (
    <Card className="border-border/50 shadow-lg shadow-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Cobros masivos</CardTitle>
        <CardDescription>
          Importa tu listado de cobros del dia y genera todos los links en un click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section - Solo visible si no hay clientes */}
        {clients.length === 0 ? (
          <div className="space-y-5">
            {/* Drop zone con boton */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-xl transition-all ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-border/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Upload className={`w-7 h-7 transition-colors ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground mb-3">
                    {isDragging ? "Suelta el archivo aqui" : "Arrastra tu archivo Excel o CSV"}
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                  </Button>
                </div>
              </div>
            </div>

            {/* Formato requerido - estilo tabla */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Formato del archivo</span>
                <Button size="sm" variant="outline" onClick={downloadTemplate} className="h-7 text-xs">
                  <Download className="mr-1.5 h-3 w-3" />
                  Descargar ejemplo
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border">nombre</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border">telefono</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground border-r border-border">monto</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">descripcion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-muted-foreground">
                      <td className="px-3 py-2 border-r border-border border-t">Juan Perez</td>
                      <td className="px-3 py-2 border-r border-border border-t font-mono">5491155551234</td>
                      <td className="px-3 py-2 border-r border-border border-t">4500</td>
                      <td className="px-3 py-2 border-t">Envio #12345</td>
                    </tr>
                    <tr className="text-muted-foreground/60">
                      <td className="px-3 py-2 border-r border-border border-t">Maria Garcia</td>
                      <td className="px-3 py-2 border-r border-border border-t font-mono">5491166662345</td>
                      <td className="px-3 py-2 border-r border-border border-t">2800</td>
                      <td className="px-3 py-2 border-t">Envio #12346</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-muted/20 border-t border-border text-xs text-muted-foreground">
                El telefono debe incluir codigo de pais (ej: 549 para Argentina). Acepta .xlsx, .xls y .csv
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header con archivo cargado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{clients.length} clientes cargados</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {readyCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs">{readyCount} listos</span>
                )}
                {errorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs">{errorCount} errores</span>
                )}
                {invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs">{invalidCount} inválidos</span>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)} className="text-muted-foreground hover:text-destructive h-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-medium text-xs">Nombre</TableHead>
                    <TableHead className="font-medium text-xs">Telefono</TableHead>
                    <TableHead className="font-medium text-xs text-right">Monto</TableHead>
                    <TableHead className="font-medium text-xs">Estado</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id} className={`group ${client.status === "invalid" ? "bg-orange-50/60 dark:bg-orange-950/20" : ""}`}>
                      <TableCell className="font-medium py-2">
                        {client.nombre || <span className="text-orange-500 italic text-xs">Sin nombre</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs py-2">{client.telefono}</TableCell>
                      <TableCell className="text-right font-medium py-2">
                        {client.monto > 0 ? formatCurrency(client.monto) : <span className="text-orange-500 text-xs">—</span>}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5">
                          {getStatusBadge(client)}
                          {client.validationError && (
                            <span className="text-[10px] text-orange-600 dark:text-orange-400">{client.validationError}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex justify-end gap-1">
                          {client.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateSinglePayment(client.id)}
                              disabled={generatingId === client.id || loading}
                              className="h-7 text-xs"
                            >
                              {generatingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generar"}
                            </Button>
                          )}
                          {client.status === "error" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateSinglePayment(client.id)}
                              disabled={generatingId === client.id || loading}
                              className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              {generatingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reintentar"}
                            </Button>
                          )}
                          {client.status === "ready" && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => setPreviewClient(client)} className="h-7 w-7">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" onClick={() => sendToWhatsApp(client)} className="h-7 w-7 bg-[#25D366] hover:bg-[#1da851] text-white">
                                <Send className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeClient(client.id)} className="h-7 w-7 hover:text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {paginatedClients.map((client) => (
                <div key={client.id} className={`p-3 border rounded-xl ${client.status === "invalid" ? "border-orange-200 bg-orange-50/60 dark:border-orange-900/40 dark:bg-orange-950/20" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{client.nombre || <span className="text-orange-500 italic">Sin nombre</span>}</p>
                        {getStatusBadge(client)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{client.telefono}</p>
                      {client.validationError && (
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">{client.validationError}</p>
                      )}
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {client.monto > 0 ? formatCurrency(client.monto) : <span className="text-orange-500">—</span>}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground truncate flex-1 mr-2">{client.descripcion}</p>
                    <div className="flex items-center gap-1">
                      {client.status === "pending" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => generateSinglePayment(client.id)} 
                          disabled={generatingId === client.id || loading}
                          className="h-8 text-xs"
                        >
                          {generatingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generar"}
                        </Button>
                      )}
                      {client.status === "error" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => generateSinglePayment(client.id)} 
                          disabled={generatingId === client.id || loading}
                          className="h-8 text-xs text-amber-600 border-amber-300"
                        >
                          {generatingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reintentar"}
                        </Button>
                      )}
                      {client.status === "ready" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => setPreviewClient(client)} className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" onClick={() => sendToWhatsApp(client)} className="h-8 w-8 bg-[#25D366] hover:bg-[#1da851] text-white">
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => removeClient(client.id)} className="h-8 w-8 hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, clients.length)} de {clients.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

{/* Category Selector */}
  <div className="space-y-2">
    <Label className="text-sm">Categoria para todos los pagos</Label>
    <CategorySelector
      value={categoryId}
      onChange={(id) => setCategoryId(id)}
    />
  </div>

  {/* Action Buttons */}
  <div className="flex gap-2">
    <Button
      onClick={generateAllPayments}
      disabled={loading || pendingCount === 0}
      className="flex-1"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando {currentIndex !== null ? `(${currentIndex + 1}/${clients.length})` : ""}...
        </>
      ) : pendingCount > 0 ? (
        `Generar ${pendingCount} pagos`
      ) : (
        <><Check className="mr-2 h-4 w-4" /> Todos los pagos generados</>
      )}
    </Button>
    {loading && (
      <Button
        size="lg"
        variant="outline"
        onClick={() => setShowClearDialog(true)}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        Detener
      </Button>
    )}
  </div>
          </>
        )}

        {/* Clear confirmation dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {loading ? "¿Detener y cargar nuevo archivo?" : "¿Limpiar el listado?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {loading
                  ? "Se detiene la generación en curso. Los pagos ya generados quedan guardados en el historial. Podés cargar un nuevo archivo."
                  : readyCount > 0
                    ? `Se eliminan ${readyCount} pago${readyCount !== 1 ? "s" : ""} generado${readyCount !== 1 ? "s" : ""} del historial. Esta acción no se puede deshacer.`
                    : "Se limpia el listado. Podés cargar un nuevo archivo."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { clearAll(); setShowClearDialog(false) }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? "Detener y limpiar" : "Limpiar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewClient} onOpenChange={() => setPreviewClient(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {previewClient?.nombre ? `Pago para ${previewClient.nombre}` : "Enlace de pago"}
              </DialogTitle>
            </DialogHeader>
            {previewClient?.paymentUrl && (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white rounded-xl border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewClient.paymentUrl)}`}
                      alt="QR de pago"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {previewClient.nombre} puede escanear este QR
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Enlace de pago</Label>
                  <div className="flex gap-2">
                    <Input
                      value={previewClient.paymentUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(previewClient.paymentUrl!)}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    sendToWhatsApp(previewClient)
                    setPreviewClient(null)
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#1da851] text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
