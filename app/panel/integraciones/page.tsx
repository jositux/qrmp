"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Eye, EyeOff, RefreshCw, Key, Webhook, Code, ExternalLink } from "lucide-react"

export default function IntegracionesPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    const generateKey = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let result = "qrp_"
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const storedKey = localStorage.getItem("qrpago_api_key")
    if (storedKey) {
      setApiKey(storedKey)
    } else {
      const newKey = generateKey()
      localStorage.setItem("qrpago_api_key", newKey)
      setApiKey(newKey)
    }
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = "qrp_"
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    localStorage.setItem("qrpago_api_key", result)
    setApiKey(result)
  }

  const maskedKey = apiKey ? `qrp_${"*".repeat(28)}${apiKey.slice(-4)}` : ""

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
        <p className="text-muted-foreground">
          Conecta tu sistema con nuestra API
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Key */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <CardTitle>API Key</CardTitle>
            </div>
            <CardDescription>
              Tu clave secreta para autenticar las peticiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Clave de API</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={showApiKey ? apiKey : maskedKey}
                    readOnly
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Copiado al portapapeles
                </p>
              )}
            </div>
            <Button variant="outline" onClick={regenerateKey} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar clave
            </Button>
            <p className="text-xs text-muted-foreground">
              Manten tu API key segura. No la compartas publicamente.
            </p>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Webhooks</CardTitle>
            </div>
            <CardDescription>
              Recibe notificaciones cuando un pago se complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL de webhook</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://tu-servidor.com/webhook"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Enviaremos un POST con los datos del pago cuando el cliente complete la transaccion.
              </p>
            </div>
            <Button className="w-full">Guardar webhook</Button>
          </CardContent>
        </Card>

        {/* Documentacion API */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Documentacion API</CardTitle>
            </div>
            <CardDescription>
              Ejemplo de como crear un pago via API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Agregado min-w-0 y overflow-x-auto al padre para contener el pre */}
            <div className="rounded-lg bg-zinc-950 p-4 overflow-x-auto min-w-0">
              <pre className="text-sm text-zinc-100 whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
                <code>{`curl -X POST https://api.qrpago.com/v1/payments \\
  -H "Authorization: Bearer ${apiKey ? apiKey.slice(0, 12) + "..." : "qrp_xxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1500.00,
    "description": "Envio #12345",
    "customer": {
      "name": "Juan Perez",
      "phone": "+5491112345678"
    }
  }'`}</code>
              </pre>
            </div>
            <div className="mt-4 flex gap-3 flex-wrap">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="#" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ver documentacion completa
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}