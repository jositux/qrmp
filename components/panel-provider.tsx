"use client"

import { GenerationProvider } from "@/contexts/generation-context"

export function PanelProvider({ children }: { children: React.ReactNode }) {
  return <GenerationProvider>{children}</GenerationProvider>
}
