"use client"

import { useRouter } from "next/navigation"
import { QrCode, LogOut, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"

interface MobileHeaderProps {
  user: User
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <QrCode className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold">QRPago</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</span>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-1 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Cerrar sesión"
        >
          {isLoggingOut
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <LogOut className="h-4 w-4" />
          }
        </button>
      </div>
    </header>
  )
}
