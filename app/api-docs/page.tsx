"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-provider"
import { 
  CreditCard,
  Copy,
  Check,
  ArrowLeft,
  Code2,
  Webhook,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function ApiDocs() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyCode = async (code: string, section: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const postExample = `fetch("https://tu-dominio.vercel.app/api/create-payment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 1500,
    title: "Envio a Posadas - Guia #12345"
  })
})`

  const responseExample = `{
  "success": true,
  "payment_url": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
  "preference_id": "1234567890-abcdef",
  "external_reference": "payment-1709912345678"
}`

  const getExample = `/api/create-payment?amount=4500&title=Encomienda%20Express`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-foreground">PagoLink</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 text-rose-600 text-sm font-medium mb-4">
            <Code2 className="w-3.5 h-3.5" />
            Documentacion API
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Integra pagos en tu sistema
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            API REST simple para generar enlaces de pago y QR. Vincula cada transaccion con tu numero de guia o tracking.
          </p>
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {/* POST Endpoint */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-mono font-medium rounded-md">POST</span>
                <code className="text-sm font-mono text-foreground">/api/create-payment</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCode(postExample, 'post')}
                className="text-muted-foreground hover:text-foreground"
              >
                {copiedSection === 'post' ? (
                  <><Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Copiado</>
                ) : (
                  <><Copy className="mr-2 h-3.5 w-3.5" /> Copiar</>
                )}
              </Button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Request</h4>
                <pre className="p-4 bg-muted/70 rounded-xl text-sm overflow-x-auto font-mono text-foreground">
                  <code>{postExample}</code>
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Response</h4>
                <pre className="p-4 bg-muted/30 rounded-xl text-sm overflow-x-auto font-mono text-foreground border border-border/50">
                  <code>{responseExample}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* GET Endpoint */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-mono font-medium rounded-md">GET</span>
                <code className="text-sm font-mono text-foreground">/api/create-payment</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCode(getExample, 'get')}
                className="text-muted-foreground hover:text-foreground"
              >
                {copiedSection === 'get' ? (
                  <><Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Copiado</>
                ) : (
                  <><Copy className="mr-2 h-3.5 w-3.5" /> Copiar</>
                )}
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm text-muted-foreground mb-3">Tambien disponible via query params:</p>
              <pre className="p-4 bg-muted/70 rounded-xl text-sm overflow-x-auto font-mono text-foreground">
                <code>{getExample}</code>
              </pre>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">Parametros</h3>
            </div>
            <div className="divide-y divide-border">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <div className="sm:w-40 flex-shrink-0">
                  <code className="text-sm font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">amount</code>
                  <span className="ml-2 text-xs text-rose-500">requerido</span>
                </div>
                <p className="text-sm text-muted-foreground">Monto a cobrar en ARS (numero). Ejemplo: 4500</p>
              </div>
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <div className="sm:w-40 flex-shrink-0">
                  <code className="text-sm font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">title</code>
                  <span className="ml-2 text-xs text-muted-foreground">opcional</span>
                </div>
                <p className="text-sm text-muted-foreground">Descripcion del pago. Ideal para incluir numero de guia o tracking. Default: "Pago"</p>
              </div>
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <div className="sm:w-40 flex-shrink-0">
                  <code className="text-sm font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">external_reference</code>
                  <span className="ml-2 text-xs text-muted-foreground">opcional</span>
                </div>
                <p className="text-sm text-muted-foreground">Referencia externa para vincular con tu sistema. Se genera automaticamente si no se envia.</p>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-2xl border border-sky-200/50 dark:border-sky-800/30 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/25">
                <Webhook className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Casos de uso</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Sucursales:</strong> Generar QR desde el sistema de gestion para cobrar envios en mostrador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Notificaciones:</strong> Enviar link de pago automatico por SMS/WhatsApp cuando el paquete llega</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Integracion ERP:</strong> Vincular cada pago con el numero de guia para conciliacion automatica</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
