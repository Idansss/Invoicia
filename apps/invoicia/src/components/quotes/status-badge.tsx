import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "CONVERTED" | "VOID"

const quoteStatusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  SENT: {
    label: "Sent",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  ACCEPTED: {
    label: "Accepted",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  EXPIRED: {
    label: "Expired",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  CONVERTED: {
    label: "Converted",
    className:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  VOID: {
    label: "Void",
    className:
      "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const config = quoteStatusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}
