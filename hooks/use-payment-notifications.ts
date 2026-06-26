"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/format"

const STORAGE_KEY = "qrmp_unread_payments"

export function usePaymentNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0
    return Number(localStorage.getItem(STORAGE_KEY) ?? 0)
  })

  const increment = useCallback(() => {
    setUnreadCount((prev) => {
      const next = prev + 1
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const clearCount = useCallback(() => {
    setUnreadCount(0)
    localStorage.setItem(STORAGE_KEY, "0")
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("payment-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
        },
        (payload) => {
          const prev = payload.old as { status?: string }
          const next = payload.new as { status?: string; nombre?: string; monto?: number }
          // Solo notificar cuando el status cambia a approved
          if (next.status === "approved" && prev.status !== "approved") {
            const nombre = next.nombre ?? "Cliente"
            const monto = next.monto ?? 0
            toast.success("Pago recibido", {
              description: `${nombre} pagó ${formatCurrency(monto)}`,
              duration: 6000,
            })
            increment()
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [increment])

  return { unreadCount, clearCount }
}
