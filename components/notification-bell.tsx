"use client"

import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePaymentNotifications } from "@/hooks/use-payment-notifications"

export function NotificationBell() {
  const router = useRouter()
  const { unreadCount, clearCount } = usePaymentNotifications()

  const handleClick = () => {
    clearCount()
    router.push("/panel/pagos-recibidos")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground"
      onClick={handleClick}
      title="Pagos recibidos"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  )
}
