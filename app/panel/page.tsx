import { PaymentsDashboard } from "@/components/payments-dashboard"

export default function PanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de tus cobros y estadisticas
        </p>
      </div>
      <PaymentsDashboard />
    </div>
  )
}
