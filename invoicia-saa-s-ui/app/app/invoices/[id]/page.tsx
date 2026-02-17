"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { InvoiceStatusBadge, DisputeStatusBadge } from "@/components/invoices/status-badge"
import { InvoiceTimeline } from "@/components/invoices/invoice-timeline"
import { mockInvoices, mockDisputes, mockAuditEvents, formatCurrency, formatDate, formatDateTime } from "@/lib/mock-data"
import { ArrowLeft, Send, Link2, Download, FileCode, Edit, Copy, MoreHorizontal, DollarSign, Calendar, MessageSquare, Paperclip } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const invoice = mockInvoices.find((i) => i.id === id) || mockInvoices[0]
  const disputes = mockDisputes.filter((d) => d.invoiceId === invoice.id)
  const activity = mockAuditEvents.filter((a) => a.entityId === invoice.number).slice(0, 5)

  const triggerAction = async (type: string, payload: Record<string, unknown>, successMessage: string) => {
    try {
      await runUiAction({ type, payload })
      toast.success(successMessage)
    } catch (error) {
      toast.error(getActionErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/app/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 bg-transparent"
            onClick={() => triggerAction("invoices.detail.send", { invoiceId: invoice.id }, "Invoice sent")}
          >
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 bg-transparent" onClick={() => { navigator.clipboard.writeText("https://invoicia.app/i/abc123"); toast.success("Payment link copied!") }}>
            <Link2 className="h-3.5 w-3.5" /> Copy link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 bg-transparent"
            onClick={() => triggerAction("invoices.detail.download-pdf", { invoiceId: invoice.id }, "PDF downloaded")}
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => triggerAction("invoices.detail.edit", { invoiceId: invoice.id }, "Edit flow opened")}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => triggerAction("invoices.detail.export-xml", { invoiceId: invoice.id }, "XML exported")}>
                <FileCode className="h-4 w-4 mr-2" /> Export XML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => triggerAction("invoices.detail.duplicate", { invoiceId: invoice.id }, "Invoice duplicated")}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <InvoiceTimeline status={invoice.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Bill To</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{invoice.customerName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
                    {invoice.poNumber && <p className="text-xs text-muted-foreground">PO: {invoice.poNumber}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Item</TableHead>
                        <TableHead className="text-xs text-right">Qty</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                        <TableHead className="text-xs text-right">Tax</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </TableCell>
                          <TableCell className="text-sm text-right text-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{item.tax}%</TableCell>
                          <TableCell className="text-sm text-right font-medium text-foreground">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="px-4 py-3 border-t border-border space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatCurrency(invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-foreground">{formatCurrency(invoice.amount - invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">{formatCurrency(invoice.amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {invoice.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {activity.length > 0 ? (
                    <div className="space-y-4">
                      {activity.map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{event.details}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.actor} - {formatDateTime(event.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disputes" className="mt-4 space-y-4">
              {disputes.length > 0 ? disputes.map((dispute) => (
                <Card key={dispute.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <DisputeStatusBadge status={dispute.status} />
                          <span className="text-xs text-muted-foreground">{formatDateTime(dispute.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground">{dispute.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="pt-6 text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-sm font-medium text-muted-foreground">No disputes</p>
                    <p className="text-xs text-muted-foreground mt-1">All good here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground">No files attached</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-transparent"
                    type="button"
                    onClick={() => triggerAction("invoices.detail.upload-file", { invoiceId: invoice.id }, "Upload panel opened")}
                  >
                    Upload file
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">PDF generated</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">XML export available</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Peppol validation</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs">Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount due</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(invoice.status === "paid" ? 0 : invoice.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                {invoice.paidDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paid on</span>
                    <span className="text-sm text-foreground">{formatDate(invoice.paidDate)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Issue date</span>
                  <span className="text-xs text-foreground">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Due date</span>
                  <span className="text-xs text-foreground">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Terms</span>
                  <span className="text-xs text-foreground">{invoice.terms || "Net 30"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Payment Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.status === "paid" ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Payment received</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{formatDate(invoice.paidDate!)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No payment attempts yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
