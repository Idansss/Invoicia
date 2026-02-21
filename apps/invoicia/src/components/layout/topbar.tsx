"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import {
  Search,
  Plus,
  Bell,
  Moon,
  Sun,
  Building2,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { setActiveOrgAction } from "@/components/app/actions"

interface TopbarProps {
  onMobileMenuToggle: () => void
  orgName?: string | null
  orgs: { id: string; name: string }[]
  activeOrgId?: string | null
  orgLogoUrl?: string | null
  user?: { name?: string | null; email?: string | null }
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "U"
}

export function Topbar({ onMobileMenuToggle, orgName, orgs, activeOrgId, orgLogoUrl, user }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchQuery.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const handleOrgSwitch = async (orgId: string, name: string) => {
    if (!orgId || orgId === activeOrgId) return
    try {
      await setActiveOrgAction(orgId)
      toast.success(`Switched to ${name}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch organization")
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
      {mobileSearchOpen ? (
        <div className="flex h-14 items-center gap-2 px-4 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="w-full pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { handleSearch(e); if (e.key === "Enter") setMobileSearchOpen(false); }}
              autoFocus
              aria-label="Search invoices"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}>
            Cancel
          </Button>
        </div>
      ) : null}
      <div className={`flex h-16 items-center justify-between px-4 lg:px-6 ${mobileSearchOpen ? "hidden sm:flex" : "flex"}`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="w-64 lg:w-80 pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              aria-label="Search invoices"
            />
          </div>
        </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:hidden"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button size="sm" className="hidden sm:flex gap-1.5 h-9 font-medium" asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9" asChild>
          <Link href="/reminders">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Reminders</span>
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden md:flex gap-1.5 h-9 px-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{orgName ?? "Organization"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {orgs.map((org) => (
              <DropdownMenuItem key={org.id} onSelect={() => handleOrgSwitch(org.id, org.name)}>
                <Building2 className="h-4 w-4 mr-2" />
                {org.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/orgs">
                <Plus className="h-4 w-4 mr-2" />
                Manage organizations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                {orgLogoUrl ? <AvatarImage src={orgLogoUrl} alt={`${orgName ?? "Organization"} logo`} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email ?? ""}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=security">
                <User className="h-4 w-4 mr-2" />
                Profile &amp; Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  )
}
