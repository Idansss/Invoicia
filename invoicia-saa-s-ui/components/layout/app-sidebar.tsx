"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  CreditCard,
  Bell,
  Palette,
  ShieldCheck,
  Settings,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

const navItems = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Invoices", href: "/app/invoices", icon: FileText },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Products", href: "/app/products", icon: Package },
  { label: "Payments", href: "/app/payments", icon: CreditCard },
  { label: "Reminders", href: "/app/reminders", icon: Bell },
  { label: "Templates", href: "/app/templates", icon: Palette },
  { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Audit Log", href: "/app/audit", icon: ClipboardList },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed ? "justify-center" : "gap-2")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight text-foreground">Invoicia</span>}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const isActive = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href)
              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return linkContent
            })}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start")}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4 mr-2" /><span className="text-xs">Collapse</span></>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}