import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

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
    <div className="min-h-screen bg-background">
      <AppSidebar user={data.user} />
      <main className="pb-16 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
