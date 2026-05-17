"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, QrCode, ExternalLink, Copy, Check, Share2 } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { CategorySelector } from "@/components/category-selector"

interface PaymentResponse {
  success: boolean
  payment_url: string
  sandbox_payment_url?: string
  qr_code_url: string
  preference_id: string
  external_reference: string
}

export function PaymentForm() {
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null)
  const [qrLoaded, setQrLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setPaymentData(null)

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          title: title || "Pago",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el pago")
      }

      setPaymentData(data)

      // Guardar en base de datos
      try {
        await fetch("/api/save-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: clientName || "Sin nombre",
            telefono: clientPhone || null,
            monto: Number(amount),
            descripcion: title || "Pago",
            payment_url: data.payment_url,
            preference_id: data.preference_id,
            category_id: categoryId,
          }),
        })
      } catch (saveError) {
        console.error("Error saving payment:", saveError)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setPaymentData(null)
    setQrLoaded(false)
    setAmount("")
    setTitle("")
    setClientName("")
    setClientPhone("")
    setCategoryId(null)
    setError("")
  }

  const getShareMessage = () => {
    const formattedAmount = formatCurrency(Number(amount))

    const lines = [
      clientName ? `Hola ${clientName}!` : "Hola!",
      "",
      "Te envío el enlace de pago:",
      "",
      `Descripción: ${title || "Pago"}`,
      `Monto: ${formattedAmount}`,
      "",
      `Pagar aquí: ${paymentData?.payment_url}`,
    ]

    return lines.join("\n")
  }

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(getShareMessage())
    // Si hay teléfono, enviar directo a ese número (formato: código país + número sin espacios ni guiones)
    const cleanPhone = clientPhone.replace(/[\s\-\(\)]/g, "")
    const phoneParam = cleanPhone ? cleanPhone : ""
    window.open(`https://wa.me/${phoneParam}?text=${message}`, "_blank")
  }

  const shareToEmail = () => {
    const subject = encodeURIComponent(`Enlace de pago - ${title || "Pago"}`)
    const body = encodeURIComponent(getShareMessage())
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
  }

  const copyShareMessage = async () => {
    await navigator.clipboard.writeText(getShareMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full">
      {!paymentData ? (
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Generar enlace de pago</CardTitle>
            <CardDescription>
              Ingresa los datos del cliente y genera el link o QR para cobrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Monto destacado */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-medium">Monto a cobrar (ARS)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  required
                  className="
    h-14 text-2xl font-semibold text-center 
    placeholder:text-muted-foreground/40 placeholder:font-normal
    /* Cambios para Desktop */
    md:h-20 md:text-3xl md:py-8 
    lg:h-24 lg:text-3xl
    transition-all duration-200 focus-visible:ring-offset-2
  "
                />
              </div>

              {/* Nombre y Telefono en 2 columnas en desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm">Nombre</Label>
                  <Input
                    id="clientName"
                    type="text"
                    placeholder="Juan Perez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-11 placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm">WhatsApp</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="5491155551234"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="h-11 placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              {/* Descripcion y Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Descripcion</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Servicio o producto"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Categoria</Label>
                  <CategorySelector
                    value={categoryId}
                    onChange={(id) => setCategoryId(id)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-5 w-5" />
                    Generar enlace de pago
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Check className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl">Enlace de pago listo</CardTitle>
            </div>
            <CardDescription>
              {clientName ? `Comparte con ${clientName} para que realice el pago` : "Comparte el enlace con tu cliente"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
                {/* Loader mientras carga el QR */}
                {!qrLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-2xl z-10">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
                      <QrCode className="absolute inset-0 m-auto w-5 h-5 text-primary/50" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground animate-pulse">Generando QR...</p>
                  </div>
                )}
                <img
                  src={paymentData.qr_code_url}
                  alt="Código QR de pago"
                  className={`w-48 h-48 sm:w-52 sm:h-52 transition-all duration-500 ${
                    qrLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  onLoad={() => setQrLoaded(true)}
                />
              </div>
              <p className={`text-sm text-muted-foreground text-center transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0"}`}>
                {clientName ? (
                  <><span className="font-medium text-foreground">{clientName}</span> puede escanear este QR con MercadoPago</>
                ) : (
                  "Escanea este QR con la app de MercadoPago"
                )}
              </p>
            </div>

            {/* Payment URL */}
            <div className="space-y-2">
              <Label>Enlace de pago</Label>
              <div className="flex gap-2">
                <Input
                  value={paymentData.payment_url}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentData.payment_url)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {clientName ? `Enviar a ${clientName}` : "Enviar al cliente"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={shareToWhatsApp}
                  className="bg-[#25D366] hover:bg-[#1da851] text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  onClick={shareToEmail}
                  variant="secondary"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Email
                </Button>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                className="w-full border-dashed border-2 hover:border-solid hover:bg-muted/50"
              >
                Generar otro pago
              </Button>
            </div>


          </CardContent>
        </Card>
      )}
    </div>
  )
}
