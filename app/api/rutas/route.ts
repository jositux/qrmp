import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data, error } = await supabase
    .from("rutas")
    .select("id, numero, nombre, ciudad_id, ciudad:ciudades(id, nombre)")
    .eq("user_id", user.id)
    .order("numero")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rutas: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const { numero, nombre, ciudad_id } = body

  if (!numero || isNaN(Number(numero))) return NextResponse.json({ error: "El número de ruta es requerido" }, { status: 400 })
  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const { data, error } = await supabase
    .from("rutas")
    .insert({ user_id: user.id, numero: Number(numero), nombre: nombre.trim(), ciudad_id: ciudad_id || null })
    .select("id, numero, nombre, ciudad_id, ciudad:ciudades(id, nombre)")
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe una ruta con ese número" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ruta: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const { error } = await supabase
    .from("rutas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
