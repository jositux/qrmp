"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Eye, EyeOff, RefreshCw, Key, Webhook, Code, Loader2, Trash2 } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked: boolean
  created_at: string
}

export default function IntegracionesPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/keys")
      const data = await res.json()
      if (data.keys) setKeys(data.keys.filter((k: ApiKey) => !k.revoked))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerateKey = async () => {
    setIsCreating(true)
    setShowApiKey(true)
    try {
      if (activeKey) {
        await fetch(`/api/keys?id=${activeKey.id}`, { method: "DELETE" })
      }
      const res = await fetch("/api/keys", { method: "POST" })
      const data = await res.json()
      if (data.key) {
        setNewKeyValue(data.key.full_key)
        fetchKeys()
      }
    } finally {
      setIsCreating(false)
    }
  }

  const revokeKey = async (id: string) => {
    setRevokingId(id)
    try {
      await fetch(`/api/keys?id=${id}`, { method: "DELETE" })
      setKeys((prev) => prev.filter((k) => k.id !== id))
      if (newKeyValue) setNewKeyValue(null)
    } finally {
      setRevokingId(null)
    }
  }

  const activeKey = keys[0]
  const maskedKey = newKeyValue
    ? `${newKeyValue.slice(0, 12)}${"*".repeat(20)}`
    : activeKey
      ? `${activeKey.key_prefix}${"*".repeat(20)}`
      : ""

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
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !activeKey && !newKeyValue ? (
              <p className="text-sm text-muted-foreground py-2">
                Todavía no generaste una API key. Crea una para empezar a integrar tu sistema.
              </p>
            ) : newKeyValue ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-medium leading-snug">
                      ⚠️ Guardá esta clave ahora. No se va a volver a mostrar.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={showApiKey ? newKeyValue : maskedKey}
                      readOnly
                      className="font-mono text-sm bg-white dark:bg-zinc-900"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="shrink-0"
                    >
                      {showApiKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => copyToClipboard(newKeyValue)}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Copiado al portapapeles</p>
                  )}
                </div>
                <Button variant="outline" onClick={regenerateKey} disabled={isCreating} className="w-full">
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Regenerar clave
                </Button>
                <p className="text-xs text-muted-foreground">Regenerar invalida la clave anterior de inmediato.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Clave de API</Label>
                  <div className="flex gap-2">
                    <Input value={maskedKey} readOnly className="font-mono text-sm" />
                    {activeKey && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => revokeKey(activeKey.id)}
                        disabled={revokingId === activeKey.id}
                      >
                        {revokingId === activeKey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Si perdiste tu clave, regenerá una nueva.</p>
                </div>
                <Button variant="outline" onClick={regenerateKey} disabled={isCreating} className="w-full">
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Regenerar clave
                </Button>
                <p className="text-xs text-muted-foreground">Regenerar invalida la clave anterior de inmediato.</p>
              </div>
            )}
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
                <code>{`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL ?? "https://tu-dominio.com"}/api/v1/payments \\
  -H "Authorization: Bearer ${newKeyValue ? newKeyValue.slice(0, 16) + "..." : activeKey ? activeKey.key_prefix + "..." : "qrp_xxx"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1500,
    "nombre": "Juan Perez",
    "telefono": "+5491112345678",
    "descripcion": "Envio #12345"
  }'`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}