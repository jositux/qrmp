"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { 
  QrCode, 
  Zap, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  FileSpreadsheet,
  MessageCircle,
  CreditCard,
  Code2,
  TrendingUp,
  Handshake,
  Smartphone,
  Send,
  BarChart3
} from "lucide-react"

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace("/auth/login") }, [router])
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/30">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-foreground">PagoLink</span>
            </div>
            <nav className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-6">
                <button 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Beneficios
                </button>
                <button 
                  onClick={() => document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Como funciona
                </button>
                <button 
                  onClick={() => document.getElementById('api')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  API
                </button>
              </div>
              <ThemeToggle />
              <Link href="/auth/login">
                <Button size="sm">Ingresar</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-dashboard-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          {/* Capa oscura encima */}
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Handshake className="w-3.5 h-3.5" />
              Crecemos juntos
            </div>
            <h1 className="animate-fade-in-up animate-delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
              Digitaliza tu recaudacion
            </h1>
            <p className="animate-fade-in-up animate-delay-200 mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Genera enlaces de pago vinculados a cada operacion. Cobra presencial con QR o envia el link por WhatsApp.
            </p>
            <div className="animate-fade-in-up animate-delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/registro">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver como funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="features" className="py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground animate-fade-in">Mas que cobrar: controla tu operacion</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto animate-fade-in animate-delay-100">
              Cada pago queda vinculado a su operacion. Concilia automaticamente y ten visibilidad total de tu recaudacion.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 [&>*]:animate-fade-in-up [&>*:nth-child(1)]:animate-delay-100 [&>*:nth-child(2)]:animate-delay-200 [&>*:nth-child(3)]:animate-delay-300 [&>*:nth-child(4)]:animate-delay-400">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Vincula cada cobro</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Asocia el pago a cliente, guia o pedido. Toda la trazabilidad en un solo lugar.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">QR o link al instante</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Genera en segundos. Comparte por WhatsApp o muestra el QR en la entrega.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Conciliacion automatica</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cuando el cliente paga, el sistema marca la operacion como cobrada. Sin planillas.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Dashboard en tiempo real</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Visualiza cobros pendientes, pagados y totales. Exporta reportes cuando necesites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section id="app" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground animate-fade-in">Dos formas de cobrar, un solo objetivo</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto animate-fade-in animate-delay-100">
              Elige el flujo que mejor se adapte a tu operacion diaria
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 [&>*]:animate-fade-in-scale [&>*:nth-child(1)]:animate-delay-200 [&>*:nth-child(2)]:animate-delay-300">
            {/* Individual Payment Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent border border-sky-200/50 dark:border-sky-800/50 p-8 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-400/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Cobro Individual</h3>
                    <p className="text-sm text-muted-foreground">Para entregas puntuales</p>
                  </div>
                </div>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-sky-100 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/30">
                  <Image
                    src="/images/qr-payment-demo.jpg"
                    alt="Cobro individual con QR"
                    fill
                    className="object-cover"
                  />
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-muted-foreground">Genera QR en segundos</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-muted-foreground">Envia por WhatsApp con un click</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-muted-foreground">El cliente paga desde su celular</span>
                  </li>
                </ul>

                <Link href="/auth/registro">
                  <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25">
                    Crear mi primer cobro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bulk Payment Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/50 dark:border-amber-800/50 p-8 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Cobro Masivo</h3>
                    <p className="text-sm text-muted-foreground">Para operaciones de alto volumen</p>
                  </div>
                </div>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30">
                  <Image
                    src="/images/bulk-payment-demo.jpg"
                    alt="Cobros masivos desde Excel"
                    fill
                    className="object-cover"
                  />
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-muted-foreground">Importa tu Excel del dia</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-muted-foreground">Genera cientos de links en 1 click</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-muted-foreground">Dashboard con metricas en tiempo real</span>
                  </li>
                </ul>

                <Link href="/auth/registro">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25">
                    Escalar mi operacion
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center [&>*]:animate-fade-in-up [&>*:nth-child(1)]:animate-delay-200 [&>*:nth-child(2)]:animate-delay-300 [&>*:nth-child(3)]:animate-delay-400">
            <div className="p-6 rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="text-4xl font-bold text-foreground mb-2">+5000</div>
              <div className="text-sm text-muted-foreground">Cobros generados</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="text-4xl font-bold text-foreground mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Tasa de conversion</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
              <div className="text-4xl font-bold text-foreground mb-2">3 seg</div>
              <div className="text-sm text-muted-foreground">Tiempo promedio por QR</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">100% Seguro</h3>
              <p className="text-sm text-muted-foreground mt-1">Pagos procesados por MercadoPago</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Success Fee</h3>
              <p className="text-sm text-muted-foreground mt-1">Solo paganos cuando cobras</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Escalable</h3>
              <p className="text-sm text-muted-foreground mt-1">Misma eficiencia con 100 o 10.000 cobros</p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/planes">
              <Button variant="outline" size="lg">
                Conoce nuestros planes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* API CTA */}
      <section id="api" className="py-16 bg-muted/30 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-card rounded-2xl border border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/25">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">API REST para integracion</h3>
                <p className="text-sm text-muted-foreground">
                  Conecta tu sistema de gestion y genera pagos vinculados a cada guia o tracking.
                </p>
              </div>
            </div>
            <Link href="/api-docs">
              <Button variant="outline" className="whitespace-nowrap">
                Ver documentacion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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
