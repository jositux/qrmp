import { NextRequest, NextResponse } from "next/server"

// CORS headers for external access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, title, description, external_reference } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto es requerido y debe ser mayor a 0" },
        { status: 400, headers: corsHeaders }
      )
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: "MERCADOPAGO_ACCESS_TOKEN no está configurado" },
        { status: 500, headers: corsHeaders }
      )
    }

    // Create a preference using MercadoPago API
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
              title: (title || "Pago").slice(0, 100),
              quantity: 1,
              unit_price: Number(amount),
              currency_id: "ARS",
            },
          ],
          external_reference: external_reference || `payment-${Date.now()}`,
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
        { status: 500, headers: corsHeaders }
      )
    }

    const preferenceData = JSON.parse(responseText)

    // Generate QR code URL using a free QR service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(preferenceData.init_point)}`

    return NextResponse.json(
      {
        success: true,
        payment_url: preferenceData.init_point,
        sandbox_payment_url: preferenceData.sandbox_init_point,
        qr_code_url: qrCodeUrl,
        preference_id: preferenceData.id,
        external_reference: preferenceData.external_reference,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Also support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const amount = searchParams.get("amount")
  const title = searchParams.get("title")
  const description = searchParams.get("description")
  const external_reference = searchParams.get("external_reference")

  if (!amount) {
    return NextResponse.json(
      {
        error: "Parámetro 'amount' requerido",
        usage: "/api/create-payment?amount=1000&title=Mi Producto",
      },
      { status: 400, headers: corsHeaders }
    )
  }

  // Reuse POST logic
  const mockRequest = {
    json: async () => ({
      amount: Number(amount),
      title,
      description,
      external_reference,
    }),
  } as NextRequest

  return POST(mockRequest)
}
