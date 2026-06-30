"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Eye, EyeOff, RefreshCw, Key, Webhook, Code, Loader2, Trash2 } from "lucide-react"

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
            ) : (
              <div className="space-y-2">
                <Label>Clave de API</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={newKeyValue ? (showApiKey ? newKeyValue : maskedKey) : maskedKey}
                      readOnly
                      className="pr-10 font-mono text-sm"
                    />
                    {newKeyValue && (
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newKeyValue ?? maskedKey)}
                    disabled={!newKeyValue}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
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
                {copied && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Copiado al portapapeles
                  </p>
                )}
                {newKeyValue && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Guardá esta clave ahora, no se va a volver a mostrar completa.
                  </p>
                )}
              </div>
            )}
            <Button variant="outline" onClick={regenerateKey} disabled={isCreating} className="w-full">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {activeKey ? "Regenerar clave" : "Generar clave"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {activeKey ? "Regenerar invalida la clave anterior de inmediato." : "Manten tu API key segura. No la compartas publicamente."}
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