"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, FileText, MoreHorizontal, Save, Send } from "lucide-react"
import { toast } from "sonner"

import { QuoteStatusBadge } from "@/components/quotes/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatMoney } from "@/lib/format"
import { convertQuoteAction, deleteQuoteAction, sendQuoteAction, updateQuoteAction, voidQuoteAction } from "../actions"

interface QuoteDetailClientProps {
  quote: {
    id: string
    number: string
    status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "CONVERTED" | "VOID"
    customerName: string
    customerEmail?: string | null
    createdAt: string
    expiresAtRaw: string
    expiresAt?: string | null
    notes: string
    amount: string
    lineItems: Array<{
      id: string
      description: string
      quantity: number
      unitPriceCents: number
      unit: string
    }>
  }
  currency: "NGN" | "USD" | "EUR" | "GBP"
}

type DetailAction = "save" | "send" | "convert" | "delete" | "void" | null

export function QuoteDetailClient({ quote, currency }: QuoteDetailClientProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(quote.notes)
  const [expiresAt, setExpiresAt] = useState(quote.expiresAtRaw)
  const [activeAction, setActiveAction] = useState<DetailAction>(null)

  const runAction = async (action: Exclude<DetailAction, null>) => {
    setActiveAction(action)
    try {
      if (action === "save") {
        await updateQuoteAction(quote.id, { notes, expiresAt })
        toast.success("Quote updated")
      } else if (action === "send") {
        await sendQuoteAction(quote.id)
        toast.success("Quote sent")
      } else if (action === "void") {
        await voidQuoteAction(quote.id)
        toast.success("Quote voided")
      } else if (action === "delete") {
        await deleteQuoteAction(quote.id)
        toast.success("Quote deleted")
        router.push("/quotes")
      } else if (action === "convert") {
        const result = await convertQuoteAction(quote.id)
        toast.success("Quote converted to invoice")
        router.push(`/invoices/${result.invoiceId}`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setActiveAction(null)
    }
  }

  const editable = quote.status !== "CONVERTED" && quote.status !== "VOID"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{quote.number}</h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {quote.customerName} ({quote.customerEmail || "No email"})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5 bg-transparent"
            type="button"
            onClick={() => runAction("send")}
            disabled={!editable || activeAction !== null}
          >
            <Send className="h-4 w-4" /> {activeAction === "send" ? "Sending..." : "Send"}
          </Button>
          <Button
            className="gap-1.5"
            type="button"
            onClick={() => runAction("convert")}
            disabled={!editable || activeAction !== null}
          >
            {activeAction === "convert" ? "Converting..." : "Convert to invoice"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => runAction("void")}
                disabled={!editable || activeAction !== null}
              >
                {activeAction === "void" ? "Voiding..." : "Void"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => runAction("delete")}
                disabled={quote.status !== "DRAFT" || activeAction !== null}
              >
                {activeAction === "delete" ? "Deleting..." : "Delete draft"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quote details</CardTitle>
            <CardDescription>Created {quote.createdAt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Expires on</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  disabled={!editable || activeAction !== null}
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium text-foreground">
                  {quote.amount}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-[120px]"
                disabled={!editable || activeAction !== null}
              />
            </div>

            <Button
              type="button"
              className="gap-1.5"
              onClick={() => runAction("save")}
              disabled={!editable || activeAction !== null}
            >
              <Save className="h-4 w-4" /> {activeAction === "save" ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.lineItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No line items on this quote yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.lineItems.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-sm">{line.description}</TableCell>
                      <TableCell className="text-right text-sm">{line.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatMoney(Math.round(line.quantity * line.unitPriceCents), currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
