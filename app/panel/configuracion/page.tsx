"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Lock, Bell, Sun, Moon, LogOut, Palette, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [notifyPayments, setNotifyPayments] = useState(true)
  const [notifyDaily, setNotifyDaily] = useState(false)

  // Para evitar hydration mismatch con el tema
  useState(() => {
    setMounted(true)
  })

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesion:", error)
      setIsLoggingOut(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contrasenas no coinciden" })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contrasena debe tener al menos 6 caracteres" })
      return
    }

    setIsUpdating(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Contrasena actualizada correctamente" })
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al actualizar la contrasena",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias
        </p>
      </div>

      {/* Apariencia y Sesion - visible especialmente en movil */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Apariencia</CardTitle>
            </div>
            <CardDescription>
              Elige el tema de la interfaz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mounted && resolvedTheme === "dark" ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <Label>Modo oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    {mounted && resolvedTheme === "dark" ? "Activado" : "Desactivado"}
                  </p>
                </div>
              </div>
              <Switch
                checked={mounted && resolvedTheme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Sesion</CardTitle>
            </div>
            <CardDescription>
              Gestiona tu sesion actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando sesion...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Se cerrara tu sesion en este dispositivo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cambiar contrasena */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Cambiar contrasena</CardTitle>
            </div>
            <CardDescription>
              Actualiza tu contrasena de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contrasena</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <p
                  className={`text-sm p-3 rounded-lg ${
                    message.type === "success"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>
              Configura como quieres recibir alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pagos recibidos</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe una notificacion cuando un cliente pague
                </p>
              </div>
              <Switch
                checked={notifyPayments}
                onCheckedChange={setNotifyPayments}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen diario</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe un resumen de cobros cada dia
                </p>
              </div>
              <Switch
                checked={notifyDaily}
                onCheckedChange={setNotifyDaily}
              />
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Las notificaciones se enviaran al email de tu cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
