"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function RouteProofBadge({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  if (process.env.NODE_ENV !== "development") return null

  return (
    <div
      className={cn(
        "fixed right-3 top-3 z-[9999] rounded-full border border-fuchsia-200/60 bg-fuchsia-600/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-lg backdrop-blur",
        className,
      )}
      data-route-proof
    >
      {text}
    </div>
  )
}
