"use client"

import { useState } from "react"
import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface AppShellClientProps {
  children: React.ReactNode
  orgName?: string | null
  orgs: { id: string; name: string }[]
  activeOrgId?: string | null
  orgLogoUrl?: string | null
  user?: { name?: string | null; email?: string | null }
}

export function AppShellClient({ children, orgName, orgs, activeOrgId, orgLogoUrl, user }: AppShellClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <div className="flex h-16 items-center gap-2 border-b border-border px-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Invoicia</span>
          </div>
          <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("flex flex-col transition-all duration-300", sidebarCollapsed ? "lg:ml-16" : "lg:ml-60")}>
        <Topbar
          onMobileMenuToggle={() => setMobileOpen(true)}
          orgName={orgName}
          orgs={orgs}
          activeOrgId={activeOrgId}
          orgLogoUrl={orgLogoUrl}
          user={user}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
