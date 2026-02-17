import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VOID"
type PaymentStatus =
  | "REQUIRES_PAYMENT_METHOD"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
type DisputeStatus = "OPEN" | "APPROVED" | "REJECTED" | "CLOSED"

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
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
  VIEWED: {
    label: "Viewed",
    className:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  OVERDUE: {
    label: "Overdue",
    className:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  PAID: {
    label: "Paid",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  VOID: {
    label: "Void",
    className:
      "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  REQUIRES_PAYMENT_METHOD: {
    label: "Requires method",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  SUCCEEDED: {
    label: "Successful",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  FAILED: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  CANCELED: {
    label: "Canceled",
    className:
      "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
  REFUNDED: {
    label: "Refunded",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
}

const disputeStatusConfig: Record<DisputeStatus, { label: string; className: string }> = {
  OPEN: {
    label: "Open",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  CLOSED: {
    label: "Closed",
    className:
      "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
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
