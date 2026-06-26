"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, QrCode, Settings, Puzzle, Bell } from "lucide-react"
import { usePaymentNotifications } from "@/hooks/use-payment-notifications"

const navigation = [
  { name: "Dashboard", href: "/panel", icon: BarChart3 },
  { name: "Cobros", href: "/panel/cobros", icon: QrCode },
  { name: "Config", href: "/panel/configuracion", icon: Settings },
  { name: "API", href: "/panel/integraciones", icon: Puzzle },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount, clearCount } = usePaymentNotifications()

  const handleBellClick = () => {
    clearCount()
    router.push("/panel/pagos-recibidos")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/panel" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
        <button
          onClick={handleBellClick}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative",
            pathname.startsWith("/panel/pagos-recibidos") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          Pagos
        </button>
      </div>
    </nav>
  )
}
