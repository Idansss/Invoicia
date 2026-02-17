"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FileText, Filter, MoreHorizontal, Plus, Search } from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { EmptyState } from "@/components/app/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuoteStatusBadge } from "@/components/quotes/status-badge"
import { convertQuoteAction, createQuoteAction, deleteQuoteAction, sendQuoteAction, voidQuoteAction } from "./actions"

export interface QuoteRow {
  id: string
  number: string
  customerName: string
  customerEmail?: string | null
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "CONVERTED" | "VOID"
  amount: string
  createdAt: string
  expiresAt?: string | null
}

interface QuotesClientProps {
  quotes: QuoteRow[]
}

type QuoteAction = "create" | "send" | "convert" | "void" | "delete"

export function QuotesClient({ quotes }: QuotesClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<QuoteAction | null>(null)
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    expiresAt: "",
    notes: "",
  })

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      if (statusFilter !== "all" && quote.status.toLowerCase() !== statusFilter) return false
      if (
        searchQuery &&
        !quote.number.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !quote.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [quotes, searchQuery, statusFilter])

  const isSubmitting = activeAction === "create"

  const handleCreateQuote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.customerName.trim()) {
      toast.error("Customer name is required")
      return
    }
    if (!formData.customerEmail.trim() || !formData.customerEmail.includes("@")) {
      toast.error("A valid customer email is required")
      return
    }
    if (!formData.expiresAt) {
      toast.error("Expiration date is required")
      return
    }

    setActiveAction("create")
    try {
      await createQuoteAction({
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        expiresAt: formData.expiresAt,
        notes: formData.notes.trim(),
      })
      toast.success("Quote draft created")
      setFormData({ customerName: "", customerEmail: "", expiresAt: "", notes: "" })
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create quote")
    } finally {
      setActiveAction(null)
    }
  }

  const runQuoteAction = async (quoteId: string, action: QuoteAction) => {
    setActiveAction(action)
    setActiveQuoteId(quoteId)
    try {
      if (action === "send") {
        await sendQuoteAction(quoteId)
        toast.success("Quote sent")
      } else if (action === "void") {
        await voidQuoteAction(quoteId)
        toast.success("Quote voided")
      } else if (action === "delete") {
        await deleteQuoteAction(quoteId)
        toast.success("Quote deleted")
      } else if (action === "convert") {
        const result = await convertQuoteAction(quoteId)
        toast.success("Quote converted to invoice")
        router.push(`/invoices/${result.invoiceId}`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setActiveAction(null)
      setActiveQuoteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Quote -> accept -> convert to invoice is a core commercial flow."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 font-medium">
                <Plus className="h-4 w-4" />
                New quote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create quote</DialogTitle>
                <DialogDescription>Start a new quote for a customer</DialogDescription>
              </DialogHeader>
              <form className="space-y-4 py-4" onSubmit={handleCreateQuote}>
                <div className="space-y-2">
                  <Label>Customer name</Label>
                  <Input
                    placeholder="Acme Corp"
                    value={formData.customerName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, customerName: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer email</Label>
                  <Input
                    type="email"
                    placeholder="billing@acme.com"
                    value={formData.customerEmail}
                    onChange={(event) => setFormData((prev) => ({ ...prev, customerEmail: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiration date</Label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(event) => setFormData((prev) => ({ ...prev, expiresAt: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Add a short note for the customer"
                    value={formData.notes}
                    onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create quote"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or quote number..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Quote #</TableHead>
                <TableHead className="text-xs font-medium">Customer</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Amount</TableHead>
                <TableHead className="hidden text-xs font-medium md:table-cell">Created</TableHead>
                <TableHead className="hidden text-xs font-medium md:table-cell">Expires</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={FileText}
                      title="No quotes found"
                      description="Create your first quote to start selling."
                      action={
                        <Button variant="outline" className="gap-2" onClick={() => setDialogOpen(true)}>
                          <Plus className="h-4 w-4" /> New quote
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <TableCell className="font-medium text-sm text-foreground">{quote.number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{quote.customerName}</p>
                        <p className="text-xs text-muted-foreground">{quote.customerEmail ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-foreground">{quote.amount}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{quote.createdAt}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{quote.expiresAt ?? "-"}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/quotes/${quote.id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => runQuoteAction(quote.id, "send")}
                            disabled={activeAction !== null || quote.status === "VOID"}
                          >
                            {activeAction === "send" && activeQuoteId === quote.id ? "Sending..." : "Send"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => runQuoteAction(quote.id, "convert")}
                            disabled={activeAction !== null || quote.status === "VOID" || quote.status === "CONVERTED"}
                          >
                            {activeAction === "convert" && activeQuoteId === quote.id ? "Converting..." : "Convert to invoice"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => runQuoteAction(quote.id, "void")}
                            disabled={activeAction !== null || quote.status === "VOID"}
                          >
                            {activeAction === "void" && activeQuoteId === quote.id ? "Voiding..." : "Void"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => runQuoteAction(quote.id, "delete")}
                            disabled={activeAction !== null || quote.status !== "DRAFT"}
                          >
                            {activeAction === "delete" && activeQuoteId === quote.id ? "Deleting..." : "Delete draft"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
