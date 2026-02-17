"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { RouteProofBadge } from "@/components/dev/route-proof-badge"

function getRouteProofText(pathname: string): string | null {
  if (pathname === "/") return "Route: / (app/page.tsx)"
  if (pathname === "/login") return "Route: /login (app/login/page.tsx)"
  if (pathname === "/signup") return "Route: /signup (app/signup/page.tsx)"

  if (pathname === "/app") return "Route: /app (app/app/page.tsx)"
  if (pathname === "/app/invoices") return "Route: /app/invoices (app/app/invoices/page.tsx)"
  if (pathname === "/app/invoices/new") return "Route: /app/invoices/new (app/app/invoices/new/page.tsx)"
  if (/^\/app\/invoices\/[^/]+$/.test(pathname))
    return "Route: /app/invoices/[id] (app/app/invoices/[id]/page.tsx)"

  if (/^\/i\/[^/]+$/.test(pathname)) return "Route: /i/[token] (app/i/[token]/page.tsx)"

  return null
}

export function RouteProofOverlay() {
  const pathname = usePathname()
  const text = React.useMemo(() => getRouteProofText(pathname), [pathname])

  if (!text) return null
  return <RouteProofBadge text={text} />
}

