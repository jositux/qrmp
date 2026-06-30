"use client"

import { useState } from "react"
import { PaymentForm } from "@/components/payment-form"
import { BulkPaymentForm } from "@/components/bulk-payment-form"
import { Users, FileSpreadsheet } from "lucide-react"
import { useGeneration } from "@/contexts/generation-context"
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

export default function CobrosPage() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  const [pendingTab, setPendingTab] = useState<"single" | "bulk" | null>(null)
  const { isGenerating } = useGeneration()

  const handleTabClick = (tab: "single" | "bulk") => {
    if (isGenerating && tab !== activeTab) {
      setPendingTab(tab)
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <>
      <AlertDialog open={!!pendingTab} onOpenChange={(open) => { if (!open) setPendingTab(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la generación?</AlertDialogTitle>
            <AlertDialogDescription>
              Hay una generación en curso. Si cambiás de pestaña se detiene, pero los pagos ya generados quedan guardados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quedarme</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setActiveTab(pendingTab!); setPendingTab(null) }}>
              Cambiar igual
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cobrar</h1>
          <p className="text-muted-foreground">
            Genera enlaces de pago y QR para tus clientes
          </p>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-border">
          <div className="flex gap-0">
            <button
              onClick={() => handleTabClick("single")}
              className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "single"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Individual</span>
              </span>
              {activeTab === "single" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => handleTabClick("bulk")}
              className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "bulk"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Masivo</span>
              </span>
              {activeTab === "bulk" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === "single" ? <PaymentForm /> : <BulkPaymentForm />}
        </div>
      </div>
    </>
  )
}
