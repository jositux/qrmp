"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, ChevronsUpDown, Plus, Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Ciudad {
  id: string
  nombre: string
}

interface Ruta {
  id: string
  numero: number
  nombre: string
  ciudad: Ciudad | null
}

interface Viajante {
  id: string
  dni: string
  nombre: string
  ruta_id: string | null
  ruta: Ruta | null
}

interface ViajanteSelectorProps {
  value: string | null
  onChange: (viajanteId: string | null) => void
}

export function ViajanteSelector({ value, onChange }: ViajanteSelectorProps) {
  const [open, setOpen] = useState(false)
  const [viajantes, setViajantes] = useState<Viajante[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newDni, setNewDni] = useState("")
  const [newNombre, setNewNombre] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchViajantes = async () => {
    try {
      const res = await fetch("/api/viajantes")
      const data = await res.json()
      if (data.viajantes) setViajantes(data.viajantes)
    } catch (error) {
      console.error("Error fetching viajantes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchViajantes()
  }, [])

  const selected = viajantes.find((v) => v.id === value)

  // Agrupar por ruta → ciudad
  const groups: { label: string; viajantes: Viajante[] }[] = []
  const sinRuta: Viajante[] = []

  viajantes.forEach((v) => {
    if (!v.ruta) {
      sinRuta.push(v)
      return
    }
    const ciudadLabel = v.ruta.ciudad ? v.ruta.ciudad.nombre : "Sin ciudad"
    const groupLabel = `${ciudadLabel} — Ruta ${v.ruta.numero} ${v.ruta.nombre}`
    const existing = groups.find((g) => g.label === groupLabel)
    if (existing) {
      existing.viajantes.push(v)
    } else {
      groups.push({ label: groupLabel, viajantes: [v] })
    }
  })

  const handleCreate = async () => {
    if (!/^\d{8}$/.test(newDni)) {
      setCreateError("El DNI debe tener exactamente 8 dígitos")
      return
    }
    if (!newNombre.trim()) {
      setCreateError("El nombre es requerido")
      return
    }

    setIsCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/viajantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: newDni, nombre: newNombre.trim() }),
      })
      const data = await res.json()

      if (res.ok && data.viajante) {
        setViajantes((prev) =>
          [...prev, data.viajante].sort((a, b) => a.nombre.localeCompare(b.nombre))
        )
        onChange(data.viajante.id)
        setNewDni("")
        setNewNombre("")
        setShowNewDialog(false)
      } else {
        setCreateError(data.error ?? "Error al crear el viajante")
      }
    } catch {
      setCreateError("Error al crear el viajante")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selected.nombre}</span>
                {selected.ruta && (
                  <span className="text-muted-foreground text-xs shrink-0">
                    R{selected.ruta.numero}
                    {selected.ruta.ciudad ? ` · ${selected.ruta.ciudad.nombre}` : ""}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Seleccionar viajante (opcional)
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nombre..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Cargando..." : "No hay viajantes"}
              </CommandEmpty>

              {value && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => { onChange(null); setOpen(false) }}
                    className="text-muted-foreground"
                  >
                    Sin viajante
                  </CommandItem>
                </CommandGroup>
              )}

              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.viajantes.map((v) => (
                    <CommandItem
                      key={v.id}
                      value={`${v.nombre} ${v.dni}`}
                      onSelect={() => { onChange(v.id); setOpen(false) }}
                    >
                      <span className="flex-1 truncate">{v.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">DNI {v.dni}</span>
                      <Check className={cn("ml-2 h-4 w-4 shrink-0", value === v.id ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              {sinRuta.length > 0 && (
                <CommandGroup heading="Sin ruta asignada">
                  {sinRuta.map((v) => (
                    <CommandItem
                      key={v.id}
                      value={`${v.nombre} ${v.dni}`}
                      onSelect={() => { onChange(v.id); setOpen(false) }}
                    >
                      <span className="flex-1 truncate">{v.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">DNI {v.dni}</span>
                      <Check className={cn("ml-2 h-4 w-4 shrink-0", value === v.id ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => { setShowNewDialog(true); setOpen(false) }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo viajante
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo viajante</DialogTitle>
            <DialogDescription>Ingresá el DNI y nombre. Podés asignar la ruta desde Configuración.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="viajante-dni">DNI</Label>
              <Input
                id="viajante-dni"
                placeholder="12345678"
                value={newDni}
                onChange={(e) => { setNewDni(e.target.value.replace(/\D/g, "").slice(0, 8)); setCreateError(null) }}
                inputMode="numeric"
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="viajante-nombre">Nombre</Label>
              <div className="flex gap-2">
                <Input
                  id="viajante-nombre"
                  placeholder="Juan Perez"
                  value={newNombre}
                  onChange={(e) => { setNewNombre(e.target.value); setCreateError(null) }}
                  maxLength={100}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate() } }}
                />
                <Button size="icon" onClick={handleCreate} disabled={isCreating} className="shrink-0 sm:hidden">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <DialogFooter className="hidden sm:flex">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setCreateError(null) }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : "Crear viajante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
