"use client"

import { useState } from "react"
import { PaymentForm } from "@/components/payment-form"
import { BulkPaymentForm } from "@/components/bulk-payment-form"
import { Users, FileSpreadsheet } from "lucide-react"

export default function CobrosPage() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cobros</h1>
        <p className="text-muted-foreground">
          Genera enlaces de pago y QR para tus clientes
        </p>
      </div>

      {/* Tab Selector */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("single")}
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
            onClick={() => setActiveTab("bulk")}
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
  )
}
