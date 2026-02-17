"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/app/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { createCustomerAction } from "./actions"

export interface CustomerRow {
  id: string
  name: string
  email?: string | null
  defaultTerms: string
  totalInvoiced: string
  outstanding: string
  outstandingCents: number
}

interface CustomersClientProps {
  customers: CustomerRow[]
}

export function CustomersClient({ customers }: CustomersClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    defaultPaymentTermsDays: "14",
    requirePurchaseOrder: false,
  })

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [customers, searchQuery])

  const handleCreateCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customerForm.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (customerForm.email && !customerForm.email.includes("@")) {
      toast.error("Enter a valid email address")
      return
    }

    setSubmitting(true)
    try {
      await createCustomerAction({
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        defaultPaymentTermsDays: customerForm.defaultPaymentTermsDays,
        requirePurchaseOrder: customerForm.requirePurchaseOrder,
      })
      toast.success("Customer added")
      setCustomerForm({
        name: "",
        email: "",
        defaultPaymentTermsDays: "14",
        requirePurchaseOrder: false,
      })
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create customer")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer directory"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 font-medium">
                <Plus className="h-4 w-4" /> Add customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Customer</DialogTitle>
                <DialogDescription>Add a new customer to your directory</DialogDescription>
              </DialogHeader>
              <form className="space-y-4 py-4" onSubmit={handleCreateCustomer}>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Customer name"
                    value={customerForm.name}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="billing@company.com"
                    value={customerForm.email}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Payment Terms (days)</Label>
                  <Input
                    type="number"
                    value={customerForm.defaultPaymentTermsDays}
                    onChange={(event) => setCustomerForm((prev) => ({ ...prev, defaultPaymentTermsDays: event.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require purchase order</p>
                    <p className="text-xs text-muted-foreground">Ask for PO number on invoices</p>
                  </div>
                  <Switch
                    checked={customerForm.requirePurchaseOrder}
                    onCheckedChange={(value) => setCustomerForm((prev) => ({ ...prev, requirePurchaseOrder: value }))}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add customer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Customer</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Terms</TableHead>
                <TableHead className="text-xs font-medium text-right">Total Invoiced</TableHead>
                <TableHead className="text-xs font-medium text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">No customers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {customer.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{customer.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{customer.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{customer.defaultTerms}</TableCell>
                    <TableCell className="text-sm font-medium text-right text-foreground">{customer.totalInvoiced}</TableCell>
                    <TableCell className="text-sm font-medium text-right">
                      <span className={customer.outstandingCents > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                        {customer.outstanding}
                      </span>
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
