import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data, error } = await supabase
    .from("ciudades")
    .select("id, nombre, created_at")
    .eq("user_id", user.id)
    .order("nombre")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ciudades: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const nombre = body.nombre?.trim()
  if (!nombre) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const { data, error } = await supabase
    .from("ciudades")
    .insert({ user_id: user.id, nombre })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe una ciudad con ese nombre" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ciudad: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const { error } = await supabase
    .from("ciudades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
