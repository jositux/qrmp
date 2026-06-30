"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, QrCode, Settings, Bell } from "lucide-react"
import { usePaymentNotifications } from "@/hooks/use-payment-notifications"
import { useGeneration } from "@/contexts/generation-context"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const navigation = [
  { name: "Dashboard", href: "/panel", icon: BarChart3 },
  { name: "Cobros", href: "/panel/cobros", icon: QrCode },
]

const navigationAfterBell = [
  { name: "Config", href: "/panel/configuracion", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { unreadCount, clearCount } = usePaymentNotifications()
  const { isGenerating } = useGeneration()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const handleNavClick = (href: string) => {
    if (isGenerating) {
      setPendingHref(href)
    } else {
      router.push(href)
    }
  }

  const handleBellClick = () => {
    clearCount()
    handleNavClick("/panel/pagos-recibidos")
  }

  return (
    <>
      <AlertDialog open={!!pendingHref} onOpenChange={(open) => { if (!open) setPendingHref(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la generación?</AlertDialogTitle>
            <AlertDialogDescription>
              Hay una generación en curso. Si salís ahora se detiene, pero los pagos ya generados quedan guardados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quedarme</AlertDialogCancel>
            <AlertDialogAction onClick={() => { router.push(pendingHref!); setPendingHref(null) }}>
              Salir igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/panel" && pathname.startsWith(item.href))
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
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
        {navigationAfterBell.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/panel" && pathname.startsWith(item.href))
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          )
        })}
      </div>
    </nav>
    </>
  )
}
