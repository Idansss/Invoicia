"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { mockCustomers, mockProducts, formatCurrency } from "@/lib/mock-data"
import { ArrowLeft, Plus, Trash2, Upload, Eye, Send, Save, MoreHorizontal, FileCode, Ban, Copy } from "lucide-react"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

interface FormLineItem {
  id: string
  productId: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export default function NewInvoicePage() {
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { id: "1", productId: "", name: "", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ])
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState(0)
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [customerId, setCustomerId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-000131")
  const [poNumber, setPoNumber] = useState("")
  const [issueDate, setIssueDate] = useState("2026-02-10")
  const [dueDate, setDueDate] = useState("2026-03-12")
  const [currency, setCurrency] = useState("USD")
  const [notes, setNotes] = useState("")
  const [terms, setTerms] = useState("Payment is due within 30 days of the invoice date.")
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: String(Date.now()), productId: "", name: "", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter((i) => i.id !== id))
  }

  const updateLineItem = (id: string, field: keyof FormLineItem, value: string | number) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const selectProduct = (lineItemId: string, productId: string) => {
    const product = mockProducts.find((p) => p.id === productId)
    if (product) {
      setLineItems(lineItems.map((item) =>
        item.id === lineItemId
          ? { ...item, productId, name: product.name, description: product.description, unitPrice: product.unitPrice }
          : item
      ))
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate) / 100, 0)
  const discountAmount = discountEnabled
    ? discountType === "percent" ? (subtotal * discountValue) / 100 : discountValue
    : 0
  const total = subtotal + taxTotal - discountAmount

  const hasValidLineItems = lineItems.some((item) => item.quantity > 0 && item.unitPrice > 0)
  const canSubmitInvoice = Boolean(customerId && invoiceNumber.trim() && issueDate && dueDate && hasValidLineItems)

  const buildInvoicePayload = () => ({
    customerId,
    invoiceNumber: invoiceNumber.trim(),
    poNumber: poNumber.trim(),
    issueDate,
    dueDate,
    currency,
    notes: notes.trim(),
    terms: terms.trim(),
    lineItems,
    subtotal,
    taxTotal,
    discountType,
    discountValue,
    discountEnabled,
    total,
    attachments: attachments.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })),
  })

  const validateForSubmission = () => {
    if (!customerId) return "Please select a customer"
    if (!invoiceNumber.trim()) return "Invoice number is required"
    if (!hasValidLineItems) return "Add at least one line item with a price"
    return null
  }

  const sendInvoice = async () => {
    const error = validateForSubmission()
    if (error) {
      toast.error(error)
      return
    }

    setSending(true)
    try {
      await runUiAction({
        type: "invoices.new.send",
        payload: buildInvoicePayload(),
      })
      toast.success("Invoice sent")
    } catch (actionError) {
      toast.error(getActionErrorMessage(actionError))
    } finally {
      setSending(false)
    }
  }

  const saveDraft = async () => {
    const error = validateForSubmission()
    if (error) {
      toast.error(error)
      return
    }

    setSavingDraft(true)
    try {
      await runUiAction({
        type: "invoices.new.save",
        payload: buildInvoicePayload(),
      })
      toast.success("Draft saved")
    } catch (actionError) {
      toast.error(getActionErrorMessage(actionError))
    } finally {
      setSavingDraft(false)
    }
  }

  const previewInvoice = async () => {
    if (!canSubmitInvoice) {
      toast.error("Complete invoice details before previewing")
      return
    }

    setPreviewing(true)
    try {
      await runUiAction({
        type: "invoices.new.preview",
        payload: buildInvoicePayload(),
      })
      toast.success("Preview ready")
    } catch (actionError) {
      toast.error(getActionErrorMessage(actionError))
    } finally {
      setPreviewing(false)
    }
  }

  const uploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment must be under 10MB")
      return
    }

    setUploading(true)
    try {
      await runUiAction({
        type: "invoices.new.attachment.upload",
        payload: { name: file.name, size: file.size, type: file.type },
      })
      setAttachments((prev) => [...prev, file])
      toast.success("Attachment uploaded")
    } catch (actionError) {
      toast.error(getActionErrorMessage(actionError))
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/app/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">New Invoice</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and send a new invoice</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">PO Number</Label>
                  <Input placeholder="Optional" className="h-9" value={poNumber} onChange={(event) => setPoNumber(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Issue Date</Label>
                  <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Line Items</CardTitle>
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs bg-transparent" onClick={addLineItem}>
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.productId} onValueChange={(v) => selectProduct(item.id, v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {mockProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.unitPrice)}/{p.unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Input value={item.description} onChange={(e) => updateLineItem(item.id, "description", e.target.value)} className="h-9" placeholder="Line item description" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Unit Price</Label>
                      <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value))} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tax (%)</Label>
                      <Input type="number" min={0} max={100} value={item.taxRate} onChange={(e) => updateLineItem(item.id, "taxRate", Number(e.target.value))} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Line Total</Label>
                      <div className="flex items-center h-9 px-3 rounded-md bg-muted text-sm font-medium text-foreground">
                        {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Discount */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Discount</CardTitle>
                <Switch checked={discountEnabled} onCheckedChange={setDiscountEnabled} />
              </div>
            </CardHeader>
            {discountEnabled && (
              <CardContent>
                <div className="flex gap-3">
                  <Select value={discountType} onValueChange={(v: "percent" | "fixed") => setDiscountType(v)}>
                    <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="h-9 w-32" placeholder={discountType === "percent" ? "%" : "$"} />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Notes & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  placeholder="Add a note for your customer..."
                  className="min-h-[80px] resize-none"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Terms</Label>
                <Textarea
                  placeholder="e.g., Net 30, Due on receipt..."
                  className="min-h-[60px] resize-none"
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                <input type="file" className="hidden" onChange={uploadAttachment} />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Drop files here or click to upload"}</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, images, or documents up to 10MB</p>
                {attachments.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">{attachments.length} attachment(s) added</p>
                ) : null}
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Preview panel */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">{formatCurrency(taxTotal)}</span>
                </div>
                {discountEnabled && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-emerald-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full gap-1.5 font-medium" onClick={sendInvoice} disabled={sending || !canSubmitInvoice}>
                  <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send invoice"}
                </Button>
                <Button variant="outline" className="w-full gap-1.5 bg-transparent" onClick={saveDraft} disabled={savingDraft || !canSubmitInvoice}>
                  <Save className="h-4 w-4" /> {savingDraft ? "Saving..." : "Save draft"}
                </Button>
                <Button variant="outline" className="w-full gap-1.5 bg-transparent" onClick={previewInvoice} disabled={previewing}>
                  <Eye className="h-4 w-4" /> {previewing ? "Generating..." : "Preview PDF"}
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs text-muted-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" /> More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await runUiAction({ type: "invoices.new.export-xml", payload: { invoiceNumber } })
                        toast.success("XML exported")
                      } catch (error) {
                        toast.error(getActionErrorMessage(error))
                      }
                    }}
                  >
                    <FileCode className="h-4 w-4 mr-2" /> Export XML
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await runUiAction({ type: "invoices.new.duplicate", payload: { invoiceNumber } })
                        toast.success("Invoice duplicated")
                      } catch (error) {
                        toast.error(getActionErrorMessage(error))
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={async () => {
                      try {
                        await runUiAction({ type: "invoices.new.void", payload: { invoiceNumber } })
                        toast.success("Invoice marked as void")
                      } catch (error) {
                        toast.error(getActionErrorMessage(error))
                      }
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" /> Void
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
