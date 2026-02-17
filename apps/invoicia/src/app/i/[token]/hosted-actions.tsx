"use client"

import { Printer, Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function HostedInvoiceActions({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 bg-transparent"
        onClick={() => window.print()}
      >
        <Printer className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Print</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 bg-transparent"
        onClick={() => {
          window.open(pdfUrl, "_blank", "noopener,noreferrer")
          toast.success("PDF downloaded")
        }}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  )
}
