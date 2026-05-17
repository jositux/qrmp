'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/payment-form'
import { BulkPaymentForm } from '@/components/bulk-payment-form'
import { PaymentsDashboard } from '@/components/payments-dashboard'
import { ThemeToggle } from '@/components/theme-provider'
import { 
  Users, 
  FileSpreadsheet,
  LogOut,
  Loader2,
  BarChart3
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'single' | 'bulk'>('dashboard')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">QRPago</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Salir</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Selector */}
        <div className="mb-8">
          <div className="flex w-full p-1.5 bg-muted/70 rounded-2xl border border-border/50">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <Users className="w-4 h-4" />
                <span>Individual</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'bulk'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Masivo</span>
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && <PaymentsDashboard />}
        {activeTab === 'single' && <PaymentForm />}
        {activeTab === 'bulk' && <BulkPaymentForm />}
      </main>
    </div>
  )
}
