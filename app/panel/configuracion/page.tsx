"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Lock, Bell, Sun, Moon, Palette, Eye, EyeOff, Tag, Trash2, Plus, X, MapPin, Route, User } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"

interface Category {
  id: string
  nombre: string
  color: string
}

interface Ciudad {
  id: string
  nombre: string
}

interface Ruta {
  id: string
  numero: number
  nombre: string
  ciudad_id: string | null
  ciudad: Ciudad | null
}

interface Viajante {
  id: string
  dni: string
  nombre: string
  ruta_id: string | null
  ruta: Ruta | null
}

const CATEGORY_COLORS = ["#ef4444","#f59e0b","#22c55e","#06b6d4","#6366f1","#ec4899"]

export default function ConfiguracionPage() {
  const { resolvedTheme, setTheme } = useTheme()
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
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatColor, setNewCatColor] = useState("#6366f1")
  const [creatingCat, setCreatingCat] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  // Ciudades
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loadingCiudades, setLoadingCiudades] = useState(true)
  const [newCiudadNombre, setNewCiudadNombre] = useState("")
  const [creatingCiudad, setCreatingCiudad] = useState(false)
  const [ciudadError, setCiudadError] = useState<string | null>(null)
  const [deletingCiudadId, setDeletingCiudadId] = useState<string | null>(null)
  const [showNewCiudad, setShowNewCiudad] = useState(false)

  // Rutas
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [loadingRutas, setLoadingRutas] = useState(true)
  const [newRutaNumero, setNewRutaNumero] = useState("")
  const [newRutaNombre, setNewRutaNombre] = useState("")
  const [newRutaCiudadId, setNewRutaCiudadId] = useState<string>("")
  const [creatingRuta, setCreatingRuta] = useState(false)
  const [rutaError, setRutaError] = useState<string | null>(null)
  const [deletingRutaId, setDeletingRutaId] = useState<string | null>(null)
  const [showNewRuta, setShowNewRuta] = useState(false)

  // Viajantes
  const [viajantes, setViajantes] = useState<Viajante[]>([])
  const [loadingViajantes, setLoadingViajantes] = useState(true)
  const [newViajanteDni, setNewViajanteDni] = useState("")
  const [newViajanteNombre, setNewViajanteNombre] = useState("")
  const [newViajanteRutaId, setNewViajanteRutaId] = useState<string>("")
  const [creatingViajante, setCreatingViajante] = useState(false)
  const [viajanteError, setViajanteError] = useState<string | null>(null)
  const [deletingViajanteId, setDeletingViajanteId] = useState<string | null>(null)
  const [showNewViajante, setShowNewViajante] = useState(false)
  const [updatingViajanteId, setUpdatingViajanteId] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (data.categories) setCategories(data.categories) })
      .catch(() => {})
      .finally(() => setLoadingCats(false))

    fetch("/api/ciudades")
      .then((r) => r.json())
      .then((data) => { if (data.ciudades) setCiudades(data.ciudades) })
      .catch(() => {})
      .finally(() => setLoadingCiudades(false))

    fetch("/api/rutas")
      .then((r) => r.json())
      .then((data) => { if (data.rutas) setRutas(data.rutas) })
      .catch(() => {})
      .finally(() => setLoadingRutas(false))

    fetch("/api/viajantes")
      .then((r) => r.json())
      .then((data) => { if (data.viajantes) setViajantes(data.viajantes) })
      .catch(() => {})
      .finally(() => setLoadingViajantes(false))
  }, [])

  // --- Contraseña ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage({ type: "error", text: "Las contraseñas no coinciden" }); return }
    if (newPassword.length < 6) { setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" }); return }
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
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Error al actualizar la contraseña" })
    } finally {
      setIsUpdating(false)
    }
  }

  // --- Categorías ---
  const handleDeleteCategory = async (id: string) => {
    setDeletingCatId(id)
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeletingCatId(null)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    if (categories.some((c) => c.nombre.toLowerCase() === newCatName.trim().toLowerCase())) {
      setCatError("Ya existe una categoría con ese nombre"); return
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
      if (!res.ok) { setCatError(data.error ?? "Error al crear la categoría"); return }
      if (data.category) {
        setCategories((prev) => [...prev, data.category].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        setNewCatName("")
        setNewCatColor("#6366f1")
        setShowNewCat(false)
      }
    } finally {
      setCreatingCat(false)
    }
  }

  // --- Ciudades ---
  const handleCreateCiudad = async () => {
    if (!newCiudadNombre.trim()) return
    setCreatingCiudad(true)
    setCiudadError(null)
    try {
      const res = await fetch("/api/ciudades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newCiudadNombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCiudadError(data.error ?? "Error al crear la ciudad"); return }
      setCiudades((prev) => [...prev, data.ciudad].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNewCiudadNombre("")
      setShowNewCiudad(false)
    } finally {
      setCreatingCiudad(false)
    }
  }

  const handleDeleteCiudad = async (id: string) => {
    setDeletingCiudadId(id)
    try {
      await fetch(`/api/ciudades?id=${id}`, { method: "DELETE" })
      setCiudades((prev) => prev.filter((c) => c.id !== id))
      setRutas((prev) => prev.map((r) => r.ciudad_id === id ? { ...r, ciudad_id: null, ciudad: null } : r))
    } finally {
      setDeletingCiudadId(null)
    }
  }

  // --- Rutas ---
  const handleCreateRuta = async () => {
    if (!newRutaNumero || !newRutaNombre.trim()) { setRutaError("Número y nombre son requeridos"); return }
    setCreatingRuta(true)
    setRutaError(null)
    try {
      const res = await fetch("/api/rutas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(newRutaNumero), nombre: newRutaNombre.trim(), ciudad_id: newRutaCiudadId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setRutaError(data.error ?? "Error al crear la ruta"); return }
      setRutas((prev) => [...prev, data.ruta].sort((a, b) => a.numero - b.numero))
      setNewRutaNumero("")
      setNewRutaNombre("")
      setNewRutaCiudadId("")
      setShowNewRuta(false)
    } finally {
      setCreatingRuta(false)
    }
  }

  const handleDeleteRuta = async (id: string) => {
    setDeletingRutaId(id)
    try {
      await fetch(`/api/rutas?id=${id}`, { method: "DELETE" })
      setRutas((prev) => prev.filter((r) => r.id !== id))
      setViajantes((prev) => prev.map((v) => v.ruta_id === id ? { ...v, ruta_id: null, ruta: null } : v))
    } finally {
      setDeletingRutaId(null)
    }
  }

  // --- Viajantes ---
  const handleCreateViajante = async () => {
    if (!/^\d{8}$/.test(newViajanteDni)) { setViajanteError("El DNI debe tener 8 dígitos"); return }
    if (!newViajanteNombre.trim()) { setViajanteError("El nombre es requerido"); return }
    setCreatingViajante(true)
    setViajanteError(null)
    try {
      const res = await fetch("/api/viajantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: newViajanteDni, nombre: newViajanteNombre.trim(), ruta_id: newViajanteRutaId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setViajanteError(data.error ?? "Error al crear el viajante"); return }
      setViajantes((prev) => [...prev, data.viajante].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setNewViajanteDni("")
      setNewViajanteNombre("")
      setNewViajanteRutaId("")
      setShowNewViajante(false)
    } finally {
      setCreatingViajante(false)
    }
  }

  const handleDeleteViajante = async (id: string) => {
    setDeletingViajanteId(id)
    try {
      await fetch(`/api/viajantes?id=${id}`, { method: "DELETE" })
      setViajantes((prev) => prev.filter((v) => v.id !== id))
    } finally {
      setDeletingViajanteId(null)
    }
  }

  const handleAssignRuta = async (viajanteId: string, rutaId: string | null) => {
    setUpdatingViajanteId(viajanteId)
    try {
      const res = await fetch("/api/viajantes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: viajanteId, ruta_id: rutaId }),
      })
      const data = await res.json()
      if (res.ok && data.viajante) {
        setViajantes((prev) => prev.map((v) => v.id === viajanteId ? data.viajante : v))
      }
    } finally {
      setUpdatingViajanteId(null)
    }
  }

  // Rutas agrupadas por ciudad para mostrar en la lista
  const rutasPorCiudad = rutas.reduce<Record<string, { ciudad: Ciudad | null; rutas: Ruta[] }>>((acc, ruta) => {
    const key = ruta.ciudad_id ?? "__sin_ciudad__"
    if (!acc[key]) acc[key] = { ciudad: ruta.ciudad, rutas: [] }
    acc[key].rutas.push(ruta)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                  <Plus className="h-4 w-4 mr-1.5" />Nueva
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
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
                      <button key={c} type="button" onClick={() => setNewCatColor(c)}
                        className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${newCatColor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                {catError && <p className="text-sm text-destructive">{catError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateCategory} disabled={!newCatName.trim() || creatingCat}>
                    {creatingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear categoría"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewCat(false); setNewCatName(""); setCatError(null) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {loadingCats ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : categories.length === 0 && !showNewCat ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aún no tenés categorías.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span key={cat.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium bg-muted">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.nombre}
                    <button onClick={() => handleDeleteCategory(cat.id)} disabled={deletingCatId === cat.id}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors">
                      {deletingCatId === cat.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ciudades + Rutas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ciudades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Ciudades</CardTitle>
                  <CardDescription className="mt-1">Cada ciudad agrupa varias rutas</CardDescription>
                </div>
              </div>
              {!showNewCiudad && (
                <Button size="sm" variant="outline" onClick={() => setShowNewCiudad(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />Nueva
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showNewCiudad && (
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre de la ciudad</Label>
                  <Input
                    autoFocus
                    placeholder="Ej: Buenos Aires, Córdoba..."
                    value={newCiudadNombre}
                    onChange={(e) => { setNewCiudadNombre(e.target.value); setCiudadError(null) }}
                    maxLength={100}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateCiudad(); if (e.key === "Escape") setShowNewCiudad(false) }}
                    className="h-9"
                  />
                </div>
                {ciudadError && <p className="text-sm text-destructive">{ciudadError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateCiudad} disabled={!newCiudadNombre.trim() || creatingCiudad}>
                    {creatingCiudad ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear ciudad"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewCiudad(false); setNewCiudadNombre(""); setCiudadError(null) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {loadingCiudades ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : ciudades.length === 0 && !showNewCiudad ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aún no tenés ciudades.</p>
            ) : (
              <div className="space-y-1.5">
                {ciudades.map((ciudad) => {
                  const rutasCount = rutas.filter((r) => r.ciudad_id === ciudad.id).length
                  return (
                    <div key={ciudad.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                      <div>
                        <p className="text-sm font-medium">{ciudad.nombre}</p>
                        <p className="text-xs text-muted-foreground">{rutasCount} ruta{rutasCount !== 1 ? "s" : ""}</p>
                      </div>
                      <button onClick={() => handleDeleteCiudad(ciudad.id)} disabled={deletingCiudadId === ciudad.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all">
                        {deletingCiudadId === ciudad.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rutas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Rutas</CardTitle>
                  <CardDescription className="mt-1">Cada ruta pertenece a una ciudad</CardDescription>
                </div>
              </div>
              {!showNewRuta && (
                <Button size="sm" variant="outline" onClick={() => setShowNewRuta(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />Nueva
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showNewRuta && (
              <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Número</Label>
                    <Input
                      autoFocus
                      placeholder="101"
                      value={newRutaNumero}
                      onChange={(e) => { setNewRutaNumero(e.target.value.replace(/\D/g, "")); setRutaError(null) }}
                      inputMode="numeric"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ciudad</Label>
                    <Select value={newRutaCiudadId} onValueChange={setNewRutaCiudadId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        {ciudades.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Ej: Centro, Norte..."
                    value={newRutaNombre}
                    onChange={(e) => { setNewRutaNombre(e.target.value); setRutaError(null) }}
                    maxLength={100}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateRuta(); if (e.key === "Escape") setShowNewRuta(false) }}
                    className="h-9"
                  />
                </div>
                {rutaError && <p className="text-sm text-destructive">{rutaError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateRuta} disabled={!newRutaNumero || !newRutaNombre.trim() || creatingRuta}>
                    {creatingRuta ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear ruta"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewRuta(false); setNewRutaNumero(""); setNewRutaNombre(""); setRutaError(null) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {loadingRutas ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : rutas.length === 0 && !showNewRuta ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aún no tenés rutas.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(rutasPorCiudad).map(([key, group]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                      {group.ciudad?.nombre ?? "Sin ciudad"}
                    </p>
                    <div className="space-y-1">
                      {group.rutas.map((ruta) => {
                        const viajantesCount = viajantes.filter((v) => v.ruta_id === ruta.id).length
                        return (
                          <div key={ruta.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 group">
                            <div>
                              <p className="text-sm font-medium">
                                <span className="text-muted-foreground mr-1.5">#{ruta.numero}</span>
                                {ruta.nombre}
                              </p>
                              <p className="text-xs text-muted-foreground">{viajantesCount} viajante{viajantesCount !== 1 ? "s" : ""}</p>
                            </div>
                            <button onClick={() => handleDeleteRuta(ruta.id)} disabled={deletingRutaId === ruta.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all">
                              {deletingRutaId === ruta.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Viajantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Viajantes</CardTitle>
                <CardDescription className="mt-1">Asigná cada viajante a una ruta</CardDescription>
              </div>
            </div>
            {!showNewViajante && (
              <Button size="sm" variant="outline" onClick={() => setShowNewViajante(true)}>
                <Plus className="h-4 w-4 mr-1.5" />Nuevo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewViajante && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">DNI</Label>
                  <Input
                    autoFocus
                    placeholder="12345678"
                    value={newViajanteDni}
                    onChange={(e) => { setNewViajanteDni(e.target.value.replace(/\D/g, "").slice(0, 8)); setViajanteError(null) }}
                    inputMode="numeric"
                    maxLength={8}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ruta</Label>
                  <Select value={newViajanteRutaId} onValueChange={setNewViajanteRutaId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {rutas.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          #{r.numero} {r.nombre}{r.ciudad ? ` · ${r.ciudad.nombre}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Juan Perez"
                  value={newViajanteNombre}
                  onChange={(e) => { setNewViajanteNombre(e.target.value); setViajanteError(null) }}
                  maxLength={100}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateViajante(); if (e.key === "Escape") setShowNewViajante(false) }}
                  className="h-9"
                />
              </div>
              {viajanteError && <p className="text-sm text-destructive">{viajanteError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateViajante} disabled={!newViajanteDni || !newViajanteNombre.trim() || creatingViajante}>
                  {creatingViajante ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear viajante"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewViajante(false); setNewViajanteDni(""); setNewViajanteNombre(""); setViajanteError(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {loadingViajantes ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : viajantes.length === 0 && !showNewViajante ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aún no tenés viajantes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">DNI</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Ruta</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {viajantes.map((v) => (
                    <tr key={v.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium">{v.nombre}</td>
                      <td className="py-2 px-3 text-muted-foreground font-mono">{v.dni}</td>
                      <td className="py-2 px-3">
                        <Select
                          value={v.ruta_id ?? "__none__"}
                          onValueChange={(val) => handleAssignRuta(v.id, val === "__none__" ? null : val)}
                          disabled={updatingViajanteId === v.id}
                        >
                          <SelectTrigger className="h-7 text-xs w-[200px] border-transparent hover:border-border focus:border-border transition-colors">
                            {updatingViajanteId === v.id ? (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />Actualizando...
                              </span>
                            ) : (
                              <SelectValue placeholder="Sin ruta" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin ruta</SelectItem>
                            {rutas.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                #{r.numero} {r.nombre}{r.ciudad ? ` · ${r.ciudad.nombre}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-3">
                        <button onClick={() => handleDeleteViajante(v.id)} disabled={deletingViajanteId === v.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all">
                          {deletingViajanteId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <Input id="new-password" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {message && (
                <p className={`text-sm p-3 rounded-lg ${message.type === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                  {message.text}
                </p>
              )}
              <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Actualizando...</> : <><Save className="mr-2 h-4 w-4" />Guardar cambios</>}
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
                <p className="text-sm text-muted-foreground">Recibí una notificación cuando un cliente pague</p>
              </div>
              <Switch checked={notifyPayments} onCheckedChange={setNotifyPayments} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resumen diario</Label>
                <p className="text-sm text-muted-foreground">Recibí un resumen de cobros cada día</p>
              </div>
              <Switch checked={notifyDaily} onCheckedChange={setNotifyDaily} />
            </div>
            <p className="text-xs text-muted-foreground pt-2">Las notificaciones se enviarán al email de tu cuenta.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
