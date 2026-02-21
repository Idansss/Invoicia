"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Send,
  Link2,
  Download,
  FileCode,
  Copy,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ReceiptText,
  Wallet,
  Ban,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InvoiceStatusBadge, DisputeStatusBadge } from "@/components/invoices/status-badge"
import { InvoiceTimeline } from "@/components/invoices/invoice-timeline"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { approveDisputeWithCreditNoteAction, rejectDisputeAction } from "./dispute-actions"
import {
  createCreditNoteUiAction,
  duplicateInvoiceUiAction,
  recordManualPaymentUiAction,
  sendInvoiceUiAction,
  voidInvoiceUiAction,
} from "./ui-actions"

interface InvoiceLineItemRow {
  id: string
  description: string
  quantity: number
  unitPriceCents: number
  taxPercent: number
  unit: string
}

interface InvoiceDisputeRow {
  id: string
  status: "OPEN" | "APPROVED" | "REJECTED" | "CLOSED"
  reasonCode: string
  message?: string | null
  createdAt: string
}

interface InvoiceArtifactRow {
  id: string
  kind: string
  storagePath: string
}

interface InvoiceAttachmentRow {
  id: string
  filename: string
  storagePath: string
}

interface InvoiceAuditEventRow {
  id: string
  action: string
  actorName: string | null
  actorEmail: string | null
  createdAt: string
}

interface InvoiceDetailProps {
  invoice: {
    id: string
    number: string
    status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VOID"
    customerName: string
    customerEmail?: string | null
    issueDate: string
    dueDate?: string | null
    notes?: string | null
    poNumber?: string | null
    token: string
    terms?: string | null
    complianceProfile: "BASE" | "PEPPOL"
    lineItems: InvoiceLineItemRow[]
    disputes: InvoiceDisputeRow[]
    exportArtifacts: InvoiceArtifactRow[]
    attachments: InvoiceAttachmentRow[]
  }
  totals: {
    subtotalCents: number
    taxCents: number
    discountCents: number
    totalCents: number
    paidCents: number
    creditsCents: number
    dueCents: number
  }
  currency: "NGN" | "USD" | "EUR" | "GBP"
  timezone: string
  auditEvents: InvoiceAuditEventRow[]
}

export function InvoiceDetailClient({ invoice, totals, currency, timezone, auditEvents }: InvoiceDetailProps) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  const [sending, setSending] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [issuingCredit, setIssuingCredit] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [manualPaymentCents, setManualPaymentCents] = useState("")
  const [creditAmountCents, setCreditAmountCents] = useState("")
  const [creditReason, setCreditReason] = useState("")

  const hostedUrl = `/i/${invoice.token}`

  const handleSendInvoice = async () => {
    if (!invoice.customerEmail) {
      toast.error("Customer email is required to send")
      return
    }
    setSending(true)
    try {
      await sendInvoiceUiAction(invoice.id)
      toast.success("Invoice sent")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invoice")
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${hostedUrl}`)
      toast.success("Payment link copied")
    } catch {
      toast.error("Unable to copy link")
    } finally {
      setCopying(false)
    }
  }

  const handleVoidInvoice = async () => {
    setVoiding(true)
    try {
      await voidInvoiceUiAction(invoice.id)
      toast.success("Invoice voided")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to void invoice")
    } finally {
      setVoiding(false)
    }
  }

  const handleRecordPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseFloat(manualPaymentCents)
    if (!manualPaymentCents || isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    setRecordingPayment(true)
    try {
      await recordManualPaymentUiAction(invoice.id, { amountCents: String(Math.round(parsed * 100)) })
      toast.success("Payment recorded")
      setManualPaymentCents("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment")
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleIssueCredit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseFloat(creditAmountCents)
    if (!creditAmountCents || isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid credit amount")
      return
    }
    setIssuingCredit(true)
    try {
      await createCreditNoteUiAction(invoice.id, { amountCents: String(Math.round(parsed * 100)), reason: creditReason })
      toast.success("Credit note issued")
      setCreditAmountCents("")
      setCreditReason("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to issue credit")
    } finally {
      setIssuingCredit(false)
    }
  }

  const handleRejectDispute = async (disputeId: string, message: string) => {
    if (!message.trim()) {
      toast.error("Add a rejection message")
      return
    }
    try {
      await rejectDisputeAction(invoice.id, { disputeId, message })
      toast.success("Dispute rejected")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject dispute")
    }
  }

  const handleApproveDispute = async (disputeId: string, amountDollars: string, reason: string) => {
    const parsed = parseFloat(amountDollars)
    if (!amountDollars || isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid credit amount")
      return
    }
    const amountCents = String(Math.round(parsed * 100))
    try {
      await approveDisputeWithCreditNoteAction(invoice.id, { disputeId, amountCents, reason })
      toast.success("Dispute approved")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve dispute")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB")
      event.target.value = ""
      return
    }
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`/api/app/invoices/${invoice.id}/attachments`, { method: "POST", body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? "Upload failed")
      }
      toast.success(`${file.name} uploaded`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setUploadingFile(false)
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
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
            onClick={handleSendInvoice}
            disabled={sending || !invoice.customerEmail}
          >
            <Send className="h-3.5 w-3.5" /> {sending ? "Sending..." : "Send"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 bg-transparent" onClick={handleCopyLink} disabled={copying}>
            <Link2 className="h-3.5 w-3.5" /> {copying ? "Copying..." : "Copy link"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 bg-transparent" asChild>
            <Link href={`/api/app/invoices/${invoice.id}/pdf`} target="_blank">
              <Download className="h-3.5 w-3.5" /> PDF
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/api/app/invoices/${invoice.id}/xml`} target="_blank">
                  <FileCode className="h-4 w-4 mr-2" /> Export XML
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    const duplicated = await duplicateInvoiceUiAction(invoice.id)
                    toast.success("Invoice duplicated")
                    router.push(`/invoices/${duplicated.id}`)
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to duplicate invoice")
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={handleVoidInvoice}
                disabled={invoice.status === "PAID" || invoice.status === "VOID"}
              >
                <Ban className="h-4 w-4 mr-2" /> {voiding ? "Voiding..." : "Void"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex justify-center">
          <InvoiceTimeline status={invoice.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Bill To</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{invoice.customerName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customerEmail ?? ""}</p>
                    {invoice.poNumber ? <p className="text-xs text-muted-foreground">PO: {invoice.poNumber}</p> : null}
                  </div>
                </CardContent>
              </Card>

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
                      {invoice.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="text-sm font-medium text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">Unit: {item.unit}</p>
                          </TableCell>
                          <TableCell className="text-sm text-right text-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{formatMoney(item.unitPriceCents, currency)}</TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{item.taxPercent}%</TableCell>
                          <TableCell className="text-sm text-right font-medium text-foreground">
                            {formatMoney(item.unitPriceCents * item.quantity, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="px-4 py-3 border-t border-border space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatMoney(totals.subtotalCents, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-foreground">{formatMoney(totals.taxCents, currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">{formatMoney(totals.totalCents, currency)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {invoice.notes ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {auditEvents.length === 0 ? (
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    </div>
                  ) : (
                    auditEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                        <div className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-primary/50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{event.action.replace(/_/g, " ").toLowerCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.actorName ?? event.actorEmail ?? "System"} &middot;{" "}
                            {formatDateTime(new Date(event.createdAt), timezone)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disputes" className="mt-4 space-y-4">
              {invoice.disputes.length > 0 ? (
                invoice.disputes.map((dispute) => (
                  <Card key={dispute.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <DisputeStatusBadge status={dispute.status} />
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(new Date(dispute.createdAt), timezone)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{dispute.message ?? dispute.reasonCode}</p>
                        </div>
                      </div>
                      {dispute.status === "OPEN" ? (
                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-2">
                            <Label className="text-xs">Reject with message</Label>
                            <Input
                              className="h-9"
                              placeholder="Explain why this is rejected..."
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault()
                                  handleRejectDispute(dispute.id, (event.target as HTMLInputElement).value)
                                }
                              }}
                            />
                            <Button size="sm" variant="outline" type="button" onClick={(event) => {
                              const input = (event.currentTarget.previousSibling as HTMLInputElement | null)
                              handleRejectDispute(dispute.id, input?.value || "")
                            }}>Reject</Button>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs">Approve with credit note</Label>
                            <div className="grid gap-2">
                              <Input className="h-9" type="number" min="0.01" step="0.01" placeholder="Credit amount (e.g. 100.00)" id={`approve-${dispute.id}`} />
                              <Input className="h-9" placeholder="Reason (optional)" id={`approve-reason-${dispute.id}`} />
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              type="button"
                              onClick={() => {
                                const amountInput = document.getElementById(`approve-${dispute.id}`) as HTMLInputElement | null
                                const reasonInput = document.getElementById(`approve-reason-${dispute.id}`) as HTMLInputElement | null
                                handleApproveDispute(dispute.id, amountInput?.value || "", reasonInput?.value || "")
                              }}
                            >
                              Approve and issue credit
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              ) : (
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
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Attachments</div>
                    <label className={`cursor-pointer rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                        className="sr-only"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        aria-label="Upload attachment"
                      />
                      {uploadingFile ? "Uploading…" : "Upload file"}
                    </label>
                  </div>
                  <div className="space-y-2">
                    {invoice.attachments.map((file) => (
                      <div key={file.id} className="rounded-lg border border-border p-3">
                        <div className="text-sm font-medium text-foreground">{file.filename}</div>
                        <div className="text-xs text-muted-foreground break-all">{file.storagePath}</div>
                      </div>
                    ))}
                    {invoice.attachments.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No files attached
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {(() => {
                    const hasPdf = invoice.exportArtifacts.some((a) => a.kind === "INVOICE_PDF")
                    const hasXml = invoice.exportArtifacts.some((a) => a.kind === "UBL_XML" || a.kind === "PEPPOL_UBL_XML")
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">PDF generated</span>
                          {hasPdf ? (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Not generated</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">XML export available</span>
                          {hasXml ? (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Not exported</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Compliance profile</span>
                          <Badge variant="outline" className="text-xs">{invoice.complianceProfile}</Badge>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount due</span>
                  <span className="text-lg font-bold text-foreground">{formatMoney(totals.dueCents, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Issue date</span>
                  <span className="text-sm text-foreground">{formatDate(new Date(invoice.issueDate), timezone)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due date</span>
                  <span className="text-sm text-foreground">
                    {invoice.dueDate ? formatDate(new Date(invoice.dueDate), timezone) : "-"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-xs text-foreground">{formatMoney(totals.subtotalCents, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tax</span>
                  <span className="text-xs text-foreground">{formatMoney(totals.taxCents, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Discount</span>
                  <span className="text-xs text-foreground">-{formatMoney(totals.discountCents, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Finance Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-2" onSubmit={handleRecordPayment}>
                <Label className="text-xs">Record manual payment</Label>
                <div className="flex gap-2">
                  <Input
                    className="h-9"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualPaymentCents}
                    onChange={(event) => setManualPaymentCents(event.target.value)}
                    placeholder="500.00"
                  />
                  <Button type="submit" variant="secondary" disabled={recordingPayment}>
                    <Wallet className="mr-2 h-4 w-4" /> {recordingPayment ? "Recording" : "Record"}
                  </Button>
                </div>
              </form>

              <form className="space-y-2" onSubmit={handleIssueCredit}>
                <Label className="text-xs">Issue credit note</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={creditAmountCents}
                  onChange={(event) => setCreditAmountCents(event.target.value)}
                  placeholder="100.00"
                />
                <Input
                  className="h-9"
                  value={creditReason}
                  onChange={(event) => setCreditReason(event.target.value)}
                  placeholder="Adjustment"
                />
                <Button type="submit" variant="outline" disabled={issuingCredit}>
                  <ReceiptText className="mr-2 h-4 w-4" /> {issuingCredit ? "Issuing..." : "Issue credit"}
                </Button>
              </form>

              <Button type="button" variant="destructive" onClick={handleVoidInvoice} disabled={voiding || invoice.status === "PAID"}>
                {voiding ? "Voiding..." : "Void invoice"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Artifacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.exportArtifacts.map((artifact) => (
                <div key={artifact.id} className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium text-foreground">{artifact.kind}</div>
                  <div className="text-xs text-muted-foreground break-all">{artifact.storagePath}</div>
                </div>
              ))}
              {invoice.exportArtifacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No artifacts yet
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
