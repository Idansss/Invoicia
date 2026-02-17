"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  Download,
  FileCode,
  Ban,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"
import {
  sendBulkRemindersAction,
  sendInvoiceFromListAction,
  trackBulkExportAction,
  voidBulkInvoicesAction,
  voidInvoiceFromListAction,
} from "./list-actions"

export interface InvoiceRow {
  id: string
  number: string
  customerName: string
  customerEmail?: string | null
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VOID"
  amount: string
  issueDate: string
  dueDate?: string | null
}

interface InvoicesClientProps {
  invoices: InvoiceRow[]
}

export function InvoicesClient({ invoices }: InvoicesClientProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status.toLowerCase() !== statusFilter) return false
      if (
        searchQuery &&
        !inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !inv.number.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false
      return true
    })
  }, [invoices, searchQuery, statusFilter])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredInvoices.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredInvoices.map((i) => i.id)))
  }

  const triggerInvoiceAction = async (action: "send" | "void", invoiceId: string, successMessage: string) => {
    setActionLoading(true)
    try {
      if (action === "send") {
        await sendInvoiceFromListAction(invoiceId)
      } else {
        await voidInvoiceFromListAction(invoiceId)
      }
      toast.success(successMessage)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and track all your invoices</p>
        </div>
        <Button className="gap-1.5 font-medium" asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            New invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    await sendBulkRemindersAction(Array.from(selectedIds))
                    toast.success("Reminders sent")
                    setSelectedIds(new Set())
                    router.refresh()
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to send reminders")
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                Send reminders
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    await trackBulkExportAction(Array.from(selectedIds))
                    toast.success("Bulk export request logged")
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to export")
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive hover:text-destructive bg-transparent"
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    await voidBulkInvoicesAction(Array.from(selectedIds))
                    toast.success("Marked as void")
                    setSelectedIds(new Set())
                    router.refresh()
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to void invoices")
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                Mark as void
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Invoice #</TableHead>
                <TableHead className="text-xs font-medium">Customer</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium text-right">Amount</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Issued</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Due</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">No invoices found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="group cursor-pointer transition-colors hover:bg-muted/50">
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                        aria-label={`Select ${invoice.number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{invoice.customerName}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customerEmail ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm text-foreground">{invoice.amount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{invoice.issueDate}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{invoice.dueDate ?? "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => triggerInvoiceAction("send", invoice.id, "Invoice sent")}
                          >
                            <Send className="h-4 w-4 mr-2" /> Send
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/api/app/invoices/${invoice.id}/pdf`} target="_blank">
                              <Download className="h-4 w-4 mr-2" /> Download PDF
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/api/app/invoices/${invoice.id}/xml`} target="_blank">
                              <FileCode className="h-4 w-4 mr-2" /> Export XML
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => triggerInvoiceAction("void", invoice.id, "Invoice voided")}
                          >
                            <Ban className="h-4 w-4 mr-2" /> Void
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {filteredInvoices.length} of {invoices.length} invoices</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
