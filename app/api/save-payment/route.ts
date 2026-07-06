import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, telefono, monto, descripcion, payment_url, preference_id, external_reference, category_id, viajante_id, remito } = body

    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        nombre,
        telefono: telefono || null,
        monto,
        descripcion: descripcion || null,
        payment_url: payment_url || null,
        preference_id: preference_id || null,
        external_reference: external_reference || null,
        category_id: category_id || null,
        viajante_id: viajante_id || null,
        remito: remito || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving payment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment: data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
