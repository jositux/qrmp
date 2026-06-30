import { createAdminClient } from "@/lib/supabase/admin"
import { hashApiKey } from "@/lib/api-keys"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const bodySchema = z.object({
  amount: z.number().positive().max(99_999_999),
  nombre: z.string().trim().min(1).max(30),
  telefono: z.string().trim().max(20).optional(),
  descripcion: z.string().trim().max(100).optional(),
  category_id: z.string().uuid().optional(),
  external_reference: z.string().trim().max(100).optional(),
})

const RATE_LIMIT_PER_MINUTE = 100

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? ""
    const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta el header Authorization: Bearer <api_key>" },
        { status: 401, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()
    const keyHash = hashApiKey(apiKey)

    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("id, user_id, revoked")
      .eq("key_hash", keyHash)
      .single()

    if (!keyRow || keyRow.revoked) {
      return NextResponse.json(
        { error: "API key inválida o revocada" },
        { status: 401, headers: corsHeaders }
      )
    }

    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      )
    }
    const { amount, nombre, telefono, descripcion, category_id, external_reference } = parsed.data

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", keyRow.user_id)
      .gte("created_at", oneMinuteAgo)

    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json(
        { error: "Límite de solicitudes excedido, intenta nuevamente en un minuto" },
        { status: 429, headers: corsHeaders }
      )
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: "MERCADOPAGO_ACCESS_TOKEN no está configurado" },
        { status: 500, headers: corsHeaders }
      )
    }

    const finalExternalReference = external_reference || `payment-${Date.now()}`

    const preferenceResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: (descripcion || nombre).slice(0, 100),
              quantity: 1,
              unit_price: amount,
              currency_id: "ARS",
            },
          ],
          external_reference: finalExternalReference,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          },
        }),
      }
    )

    const responseText = await preferenceResponse.text()

    if (!preferenceResponse.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { raw: responseText }
      }
      return NextResponse.json(
        { error: "Error al crear la preferencia de pago", details: errorData },
        { status: 502, headers: corsHeaders }
      )
    }

    const preferenceData = JSON.parse(responseText)

    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: keyRow.user_id,
        nombre,
        telefono: telefono || null,
        monto: amount,
        descripcion: descripcion || null,
        payment_url: preferenceData.init_point,
        preference_id: preferenceData.id,
        external_reference: finalExternalReference,
        category_id: category_id || null,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error saving payment from external API:", insertError)
      return NextResponse.json(
        { error: "Error al guardar el pago" },
        { status: 500, headers: corsHeaders }
      )
    }

    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id)
      .then(() => {})

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(preferenceData.init_point)}`

    return NextResponse.json(
      {
        success: true,
        id: payment.id,
        payment_url: preferenceData.init_point,
        sandbox_payment_url: preferenceData.sandbox_init_point,
        qr_code_url: qrCodeUrl,
        preference_id: preferenceData.id,
        external_reference: finalExternalReference,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("Error in /api/v1/payments:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders }
    )
  }
}
