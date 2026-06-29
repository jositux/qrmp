"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, Lock, Bell, Sun, Moon, Palette, Eye, EyeOff, Tag, Trash2, Plus, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"

interface Category {
  id: string
  nombre: string
  color: string
}

const CATEGORY_COLORS = ["#ef4444","#f59e0b","#22c55e","#06b6d4","#6366f1","#ec4899"]

export default function ConfiguracionPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [notifyPayments, setNotifyPayments] = useState(true)
  const [notifyDaily, setNotifyDaily] = useState(false)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState("#6366f1")
  const [creatingCat, setCreatingCat] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  useState(() => { setMounted(true) })

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (data.categories) setCategories(data.categories) })
      .catch(() => {})
      .finally(() => setLoadingCats(false))
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
      return
    }
    setIsUpdating(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setMessage({ type: "success", text: "Contraseña actualizada correctamente" })
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al actualizar la contraseña",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    const nameLower = newCatName.trim().toLowerCase()
    if (categories.some((c) => c.nombre.toLowerCase() === nameLower)) {
      setCatError("Ya existe una categoría con ese nombre")
      return
    }
    setCreatingCat(true)
    setCatError(null)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newCatName.trim(), color: newCatColor }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCatError(data.error ?? "Error al crear la categoría")
        return
      }
      if (data.category) {
        setCategories((prev) =>
          [...prev, data.category].sort((a, b) => a.nombre.localeCompare(b.nombre))
        )
        setNewCatName("")
        setNewCatColor("#6366f1")
        setShowNewCat(false)
      }
    } finally {
      setCreatingCat(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
      </div>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Apariencia</CardTitle>
          </div>
          <CardDescription>Elige el tema de la interfaz</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Categorías */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Categorías</CardTitle>
                <CardDescription className="mt-1">Organizá tus cobros por categoría</CardDescription>
              </div>
            </div>
            {!showNewCat && (
              <Button size="sm" variant="outline" onClick={() => setShowNewCat(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Nueva
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* New category form */}
          {showNewCat && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input
                  autoFocus
                  placeholder="Ej: Consultoría, Servicios..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  maxLength={30}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateCategory(); if (e.key === "Escape") setShowNewCat(false) }}
                  className="h-9"
                />
                {newCatName.length > 20 && (
                  <p className="text-[11px] text-muted-foreground text-right">{newCatName.length}/30</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${newCatColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {catError && (
                <p className="text-sm text-destructive">{catError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim() || creatingCat}
                >
                  {creatingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear categoría"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowNewCat(false); setNewCatName(""); setCatError(null) }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {loadingCats ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 && !showNewCat ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no tenés categorías. Creá una para organizar tus cobros.
            </p>
          ) : (
            <div className="space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium">{cat.nombre}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={deletingId === cat.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                  >
                    {deletingId === cat.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cambiar contraseña */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Cambiar contraseña</CardTitle>
            </div>
            <CardDescription>Actualizá tu contraseña de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
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
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
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
                <p className={`text-sm p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}>
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
            <CardDescription>Configurá cómo querés recibir alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pagos recibidos</Label>
                <p className="text-sm text-muted-foreground">
                  Recibí una notificación cuando un cliente pague
                </p>
              </div>
              <Switch checked={notifyPayments} onCheckedChange={setNotifyPayments} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen diario</Label>
                <p className="text-sm text-muted-foreground">
                  Recibí un resumen de cobros cada día
                </p>
              </div>
              <Switch checked={notifyDaily} onCheckedChange={setNotifyDaily} />
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Las notificaciones se enviarán al email de tu cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
