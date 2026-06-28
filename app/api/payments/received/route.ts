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
    const search = searchParams.get("q") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const categoryId = searchParams.get("category_id") || ""
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")))
    const offset = (page - 1) * limit

    let query = supabase
      .from("payments")
      .select("id, nombre, monto, descripcion, paid_at, payment_method, mp_payment_id, category_id, category:categories(id, nombre, color)", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("paid_at", { ascending: false })

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,mp_payment_id.ilike.%${search}%`)
    }

    if (from) {
      query = query.gte("paid_at", from)
    }

    if (to) {
      query = query.lte("paid_at", `${to}T23:59:59.999Z`)
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching received payments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, total: count ?? 0, page, limit })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
