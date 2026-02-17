"use client"

import { use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"
import { mockCustomers, mockInvoices, formatCurrency, formatDate } from "@/lib/mock-data"
import { ArrowLeft, Mail, Building2, Calendar, DollarSign, FileText } from "lucide-react"

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const customer = mockCustomers.find((c) => c.id === id) || mockCustomers[0]
  const customerInvoices = mockInvoices.filter((i) => i.customerId === customer.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/app/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {customer.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Invoiced", value: formatCurrency(customer.totalInvoiced), icon: DollarSign },
          { label: "Outstanding", value: formatCurrency(customer.outstanding), icon: Calendar },
          { label: "Invoices", value: String(customerInvoices.length), icon: FileText },
          { label: "Default Terms", value: customer.defaultTerms, icon: Building2 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Invoice</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">No invoices yet</TableCell>
                </TableRow>
              ) : (
                customerInvoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/app/invoices/${inv.id}`} className="text-sm font-medium text-foreground hover:text-primary">{inv.number}</Link>
                    </TableCell>
                    <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-sm font-medium text-right text-foreground">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{formatDate(inv.dueDate)}</TableCell>
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
