import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileHeader } from "@/components/mobile-header"
import { PanelProvider } from "@/components/panel-provider"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <PanelProvider>
      <div className="min-h-screen bg-background">
        <MobileHeader user={data.user} />
        <AppSidebar user={data.user} />
        <main className="pt-14 pb-16 md:pt-0 md:pb-0 md:pl-64">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </PanelProvider>
  )
}
