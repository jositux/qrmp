import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Cliente admin que bypasea RLS (webhook no tiene sesión de usuario)
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado")
  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MercadoPago envía notificaciones de distintos tipos; solo procesamos "payment"
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const mpPaymentId = String(body.data.id)
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN no configurado")
      return NextResponse.json({ error: "Config error" }, { status: 500 })
    }

    // Consultar los detalles del pago a MercadoPago para verificar que es real
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!mpResponse.ok) {
      console.error("Error al consultar pago en MP:", await mpResponse.text())
      return NextResponse.json({ error: "MP query failed" }, { status: 502 })
    }

    const mpPayment = await mpResponse.json()

    // Solo procesar pagos aprobados
    if (mpPayment.status !== "approved") {
      return NextResponse.json({ received: true, status: mpPayment.status }, { status: 200 })
    }

    const supabase = createAdminClient()

    // Deduplicación: si ya procesamos este mp_payment_id, ignorar
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("mp_payment_id", mpPaymentId)
      .single()

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    // Buscar el pago local por preference_id
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("id")
      .eq("preference_id", mpPayment.preference_id)
      .single()

    if (findError || !payment) {
      // El pago puede no existir si fue creado externamente; no es un error crítico
      return NextResponse.json({ received: true, matched: false }, { status: 200 })
    }

    // Actualizar el pago con los datos de confirmación
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "approved",
        mp_payment_id: mpPaymentId,
        paid_at: mpPayment.date_approved ?? new Date().toISOString(),
        payment_method: mpPayment.payment_type_id ?? null,
      })
      .eq("id", payment.id)

    if (updateError) {
      console.error("Error actualizando pago:", updateError)
      return NextResponse.json({ error: "DB update failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true, matched: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
