import { Badge } from "@/components/ui/badge"
import type { InvoiceStatus, PaymentStatus, DisputeStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  sent: { label: "Sent", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  viewed: { label: "Viewed", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  void: { label: "Void", className: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  successful: { label: "Successful", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
}

const disputeStatusConfig: Record<DisputeStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" },
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}

export function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const config = disputeStatusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  )
}