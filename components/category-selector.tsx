"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { Check, ChevronsUpDown, Plus, Trash2, Loader2, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  nombre: string
  color: string
}

interface CategorySelectorProps {
  value: string | null
  onChange: (categoryId: string | null, categoryName?: string) => void
  onCategoriesChange?: () => void
}

const COLORS = [
  "#ef4444", // rojo
  "#f59e0b", // amarillo
  "#22c55e", // verde
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#ec4899", // rosa
]

export function CategorySelector({ value, onChange, onCategoriesChange }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const selectedCategory = categories.find((c) => c.id === value)

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return

    setIsCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newCategoryName.trim(),
          color: newCategoryColor,
        }),
      })

      const data = await res.json()

      if (res.ok && data.category) {
        setCategories((prev) => [...prev, data.category].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        onChange(data.category.id, data.category.nombre)
        setNewCategoryName("")
        setNewCategoryColor("#6366f1")
        setShowNewDialog(false)
        onCategoriesChange?.()
      } else {
        setCreateError(data.error ?? "Ya existe la categoría")
      }
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation()
    setDeletingId(categoryId)

    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, { method: "DELETE" })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId))
        if (value === categoryId) {
          onChange(null)
        }
        onCategoriesChange?.()
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    } finally {
      setDeletingId(null)
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
            {selectedCategory ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                {selectedCategory.nombre}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Seleccionar categoria (opcional)
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Cargando..." : "No hay categorias"}
              </CommandEmpty>
              <CommandGroup>
                {value && (
                  <CommandItem
                    onSelect={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className="text-muted-foreground"
                  >
                    <span className="flex-1">Sin categoria</span>
                  </CommandItem>
                )}
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.nombre}
                    onSelect={() => {
                      onChange(category.id, category.nombre)
                      setOpen(false)
                    }}
                    className="group"
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2 shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 truncate max-w-[160px]">{category.nombre}</span>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <button
                      onClick={(e) => handleDelete(e, category.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                      disabled={deletingId === category.id}
                    >
                      {deletingId === category.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      )}
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowNewDialog(true)
                    setOpen(false)
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear nueva categoria
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Dialog para crear categoria */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva categoria</DialogTitle>
            <DialogDescription>
              Crea una categoria para organizar tus cobros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="flex items-center justify-between">
                Nombre
                {newCategoryName.length > 20 && (
                  <span className={`text-xs font-normal ${newCategoryName.length >= 30 ? "text-destructive" : "text-muted-foreground"}`}>
                    {newCategoryName.length}/30
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="category-name"
                  placeholder="Ej: Envios, Productos, Servicios..."
                  value={newCategoryName}
                  onChange={(e) => { setNewCategoryName(e.target.value); setCreateError(null) }}
                  maxLength={30}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCreate()
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleCreate}
                  disabled={isCreating || !newCategoryName.trim()}
                  className="shrink-0 sm:hidden"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
              {createError && (
                <p className="text-xs text-destructive">{createError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all hover:scale-110",
                      newCategoryColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: newCategoryColor }}
              />
              <span className="font-medium">
                {newCategoryName || "Vista previa"}
              </span>
            </div>
          </div>
          <DialogFooter className="hidden sm:flex">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setCreateError(null) }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newCategoryName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear categoria"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
