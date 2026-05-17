"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-provider"
import Link from "next/link"
import {
  CreditCard,
  ArrowLeft,
  Check,
  TrendingDown,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Banknote,
  PiggyBank,
  LineChart,
  Clock,
} from "lucide-react"

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/30">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-foreground">PagoLink</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 dark:from-emerald-950/50 via-background to-background" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
            Sin costos fijos, creces y paganos menos
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            Modelo de success fee: solo paganos cuando cobras. A mayor volumen, menor porcentaje. Asi de simple.
          </p>
        </div>
      </section>

      {/* Beneficios principales */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <Banknote className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Cero inversion inicial</h3>
              <p className="text-sm text-muted-foreground">Sin setup, sin mensualidades, sin minimos. Empezas a usar y listo.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/25">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Comision decreciente</h3>
              <p className="text-sm text-muted-foreground">Mientras mas creces, menos pagas. Premiamos tu volumen.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                <PiggyBank className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Sin riesgo</h3>
              <p className="text-sm text-muted-foreground">Si no procesas pagos, no pagas nada. Solo cobramos por transaccion exitosa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comisiones */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Comisiones por volumen mensual</h2>
          <p className="text-muted-foreground mb-10">
            El porcentaje baja automaticamente a medida que procesas mas.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-card rounded-xl border border-border/50">
              <div>
                <p className="font-medium text-foreground">Hasta $1.000.000</p>
                <p className="text-sm text-muted-foreground">Para operaciones iniciales</p>
              </div>
              <span className="text-2xl font-bold text-foreground">1.0%</span>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-card rounded-xl border border-border/50">
              <div>
                <p className="font-medium text-foreground">De $1.000.000 a $5.000.000</p>
                <p className="text-sm text-muted-foreground">Operacion en crecimiento</p>
              </div>
              <span className="text-2xl font-bold text-foreground">0.8%</span>
            </div>
            
            <div className="flex items-center justify-between p-5 bg-card rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <div>
                <p className="font-medium text-foreground">Mas de $5.000.000</p>
                <p className="text-sm text-muted-foreground">Alto volumen</p>
              </div>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0.6%</span>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            + comision de MercadoPago que corresponda segun tu cuenta
          </p>
        </div>
      </section>

      {/* Beneficios para el cliente */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Que ganas con PagoLink</h2>
          <p className="text-muted-foreground mb-10">
            Herramientas para mejorar tu operacion y tomar mejores decisiones.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <LineChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Analitica para tomar decisiones</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Visualiza que porcentaje de tus cobros se digitalizan vs efectivo. Compara rendimiento entre puntos de venta o vendedores. Identifica oportunidades para mejorar tu tasa de conversion a pago digital.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Conciliacion automatica</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cada pago queda vinculado a tu numero de guia, pedido o referencia. No mas cruces manuales entre lo que cobras y lo que entregas. Todo matchea automaticamente.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Menos tiempo en cobranza</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Genera cientos de links en segundos desde tu Excel. Envia por WhatsApp en un click. Reduce el tiempo que tu equipo dedica a perseguir pagos.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Menos efectivo, menos riesgo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cada cobro digital es un cobro que no requiere manejar efectivo. Reduces riesgos de robo, errores de caja y faltantes en la rendicion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lo que incluye */}
      <section className="py-16 bg-muted/30 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">Todo incluido, sin extras</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Generacion ilimitada de links y QR",
              "Importacion masiva desde Excel/CSV",
              "Envio directo a WhatsApp",
              "Dashboard de analitica en tiempo real",
              "API REST para integracion",
              "Webhooks con reintentos garantizados",
              "Conciliacion con metadata personalizada",
              "Soporte tecnico incluido",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Proba sin compromiso</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Genera tu primer link de pago en menos de un minuto. Sin registros, sin contratos.
          </p>
          <Link href="/#app">
            <Button size="lg" className="gap-2">
              Empezar ahora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-foreground">PagoLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Herramienta de cobros con MercadoPago
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
