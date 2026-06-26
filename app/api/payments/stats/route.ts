import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parametros de fecha
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    // Calcular fechas de inicio y fin
    let startDate: Date
    let endDate: Date

    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999) // Incluir todo el día final
    } else {
      // Default: último mes
      endDate = new Date()
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    // Calcular días entre fechas
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const daysToShow = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Obtener pagos del usuario en el rango de fechas
    const { data: payments, error } = await supabase
      .from("payments")
      .select("monto, created_at, status, paid_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching stats:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calcular totales
    const totalMonto = payments?.reduce((sum, p) => sum + Number(p.monto), 0) || 0
    const totalPagos = payments?.length || 0

    // Totales de pagos aprobados
    const approvedPayments = payments?.filter((p) => p.status === "approved") || []
    const totalCobrado = approvedPayments.reduce((sum, p) => sum + Number(p.monto), 0)
    const totalPagados = approvedPayments.length

    // Agrupar por dia para el grafico (solicitado)
    const dailyData: Record<string, number> = {}
    payments?.forEach((p) => {
      const date = new Date(p.created_at).toISOString().split("T")[0]
      dailyData[date] = (dailyData[date] || 0) + Number(p.monto)
    })

    // Agrupar pagos aprobados por dia (usando paid_at si existe, sino created_at)
    const dailyPaid: Record<string, number> = {}
    approvedPayments.forEach((p) => {
      const dateStr = p.paid_at
        ? new Date(p.paid_at).toISOString().split("T")[0]
        : new Date(p.created_at).toISOString().split("T")[0]
      dailyPaid[dateStr] = (dailyPaid[dateStr] || 0) + Number(p.monto)
    })

    // Convertir a array para el grafico
    const chartData = []
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      chartData.push({
        date: dateStr,
        monto: dailyData[dateStr] || 0,
        cobrado: dailyPaid[dateStr] || 0,
      })
    }

    // Calcular acumulados
    let accumulated = 0
    let accumulatedCobrado = 0
    const accumulatedData = chartData.map((d) => {
      accumulated += d.monto
      accumulatedCobrado += d.cobrado
      return {
        date: d.date,
        monto: d.monto,
        acumulado: accumulated,
        cobrado: d.cobrado,
        acumuladoCobrado: accumulatedCobrado,
      }
    })

    return NextResponse.json({
      totalMonto,
      totalPagos,
      totalCobrado,
      totalPagados,
      chartData: accumulatedData,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
