import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data, error } = await supabase
    .from("viajantes")
    .select("id, dni, nombre, created_at")
    .eq("user_id", user.id)
    .order("nombre")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ viajantes: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const { dni, nombre } = body

  if (!dni || !/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: "El DNI debe tener exactamente 8 dígitos" }, { status: 400 })
  }
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("viajantes")
    .insert({ user_id: user.id, dni, nombre: nombre.trim() })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un viajante con ese DNI" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ viajante: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const { error } = await supabase
    .from("viajantes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
