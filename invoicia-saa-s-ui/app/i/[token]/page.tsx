"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { mockInvoices, formatCurrency, formatDate } from "@/lib/mock-data"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"
import {
  FileText,
  Download,
  CreditCard,
  CheckCircle2,
  MessageSquare,
  Printer,
  Building2,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [showDispute, setShowDispute] = useState(false)
  const [disputeMessage, setDisputeMessage] = useState("")

  // In a real app, we'd look up the invoice by token
  // For the demo, we use the first non-draft, non-void invoice
  const invoice =
    mockInvoices.find(
      (i) => i.status !== "draft" && i.status !== "void"
    ) || mockInvoices[0]
  const isPaid = invoice.status === "paid"
  const isOverdue = invoice.status === "overdue"
  const subtotal = invoice.items.reduce(
    (s, i) => s + i.quantity * i.unitPrice,
    0
  )
  const taxAmount = invoice.amount - subtotal

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Invoicia
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 bg-transparent"
              onClick={() => {
                window.print()
              }}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 bg-transparent"
              onClick={() => toast.success("PDF downloaded")}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        {/* Status Banner */}
        {isPaid && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Payment received
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                This invoice was paid on{" "}
                {invoice.paidDate ? formatDate(invoice.paidDate) : "N/A"}.
                Thank you!
              </p>
            </div>
          </div>
        )}

        {isOverdue && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                Payment overdue
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                This invoice was due on {formatDate(invoice.dueDate)}. Please
                arrange payment as soon as possible.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {invoice.number}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <InvoiceStatusBadge status={invoice.status} />
                  {invoice.poNumber && (
                    <Badge variant="outline" className="text-xs">
                      PO: {invoice.poNumber}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(
                    isPaid ? 0 : invoice.amount,
                    invoice.currency
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPaid ? "Paid in full" : "Amount due"}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  From
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Acme Corporation
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-[22px]">
                    123 Business Ave, Suite 100
                  </p>
                  <p className="text-xs text-muted-foreground pl-[22px]">
                    San Francisco, CA 94105
                  </p>
                  <div className="flex items-center gap-2 pl-[22px]">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      billing@acmecorp.com
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bill To
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {invoice.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-[22px]">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {invoice.customerEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Issued
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Due
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Terms
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {invoice.terms || "Net 30"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Qty</TableHead>
                  <TableHead className="text-xs text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-xs text-right">Tax</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-right text-foreground">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-right text-foreground">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {item.tax}%
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium text-foreground">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-4 py-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total Due</span>
                <span className="text-foreground">
                  {formatCurrency(isPaid ? 0 : invoice.amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {!isPaid && (
          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base font-semibold gap-2"
              onClick={() =>
                toast.success("Redirecting to payment gateway...")
              }
            >
              <CreditCard className="h-5 w-5" />
              Pay {formatCurrency(invoice.amount)}
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 bg-transparent"
                onClick={() => toast.success("PDF downloaded")}
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5 bg-transparent"
                onClick={() => setShowDispute(!showDispute)}
              >
                <MessageSquare className="h-4 w-4" /> Raise Dispute
              </Button>
            </div>
          </div>
        )}

        {/* Dispute Form */}
        {showDispute && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Raise a Dispute
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Describe the issue with this invoice and we{"'"}ll review it
                  promptly.
                </p>
              </div>
              <Textarea
                placeholder="Describe your concern..."
                className="min-h-[100px]"
                value={disputeMessage}
                onChange={(e) => setDisputeMessage(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    setShowDispute(false)
                    setDisputeMessage("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success("Dispute submitted successfully")
                    setShowDispute(false)
                    setDisputeMessage("")
                  }}
                  disabled={!disputeMessage.trim()}
                >
                  Submit dispute
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This invoice was sent via{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Invoicia
            </Link>
            . Questions? Contact{" "}
            <span className="text-foreground">billing@acmecorp.com</span>
          </p>
        </footer>
      </main>
    </div>
  )
}
