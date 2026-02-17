import React from "react"
import { CheckCircle2, Send, Eye, Clock, Ban, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VOID"

const statusSteps: Record<InvoiceStatus, string[]> = {
  DRAFT: ["Created"],
  SENT: ["Created", "Sent"],
  VIEWED: ["Created", "Sent", "Viewed"],
  OVERDUE: ["Created", "Sent", "Overdue"],
  PAID: ["Created", "Sent", "Viewed", "Paid"],
  VOID: ["Created", "Voided"],
}

const stepIcons: Record<string, React.ElementType> = {
  Created: FileText,
  Sent: Send,
  Viewed: Eye,
  Paid: CheckCircle2,
  Overdue: Clock,
  Voided: Ban,
}

export function InvoiceTimeline({ status }: { status: InvoiceStatus }) {
  const steps = statusSteps[status]
  const allPossible = ["Created", "Sent", "Viewed", "Paid"]

  return (
    <div className="flex items-center gap-0">
      {allPossible.map((step, idx) => {
        const isCompleted = steps.includes(step)
        const isLast = idx === allPossible.length - 1
        const Icon = stepIcons[step] || FileText

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground bg-card"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className={cn("text-xs font-medium", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5 mx-1 mt-[-18px]",
                  isCompleted && steps.includes(allPossible[idx + 1]) ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
