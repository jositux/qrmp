import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("category_id") || ""

    let query = supabase
      .from("payments")
      .select(`
        *,
        category:categories(id, nombre, color)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.ilike("nombre", `%${search}%`)
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payments: data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, category_id } = body

    console.log("[PATCH payments] id:", id, "category_id:", category_id, "user:", user.id)

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const { error, count } = await supabase
      .from("payments")
      .update({ category_id: category_id ?? null })
      .eq("id", id)
      .eq("user_id", user.id)

    console.log("[PATCH payments] error:", error, "count:", count)

    if (error) {
      console.error("Error updating payment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const ids = searchParams.get("ids") // borrado masivo: ids separados por coma

    if (!id && !ids) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const idsToDelete = ids ? ids.split(",").filter(Boolean) : [id!]

    const { error } = await supabase
      .from("payments")
      .delete()
      .in("id", idsToDelete)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting payment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: idsToDelete.length })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
