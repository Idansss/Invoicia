import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, Calendar, DollarSign, FileText } from "lucide-react"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatDate, formatMoney } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const customer = await prisma.customer.findFirst({
    where: { id, orgId },
  })
  if (!customer) return notFound()

  const invoices = await prisma.invoice.findMany({
    where: { orgId, customerId: customer.id },
    include: { lineItems: true, payments: true, creditNotes: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true },
  })

  const totals = invoices.reduce(
    (acc, inv) => {
      const invoiceTotals = computeInvoiceTotals(inv)
      const paidCents = inv.payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amountCents, 0)
      const creditsCents = inv.creditNotes.reduce((s, c) => s + c.amountCents, 0)
      const dueCents = Math.max(0, invoiceTotals.totalCents - paidCents - creditsCents)
      return {
        totalCents: acc.totalCents + invoiceTotals.totalCents,
        outstandingCents: acc.outstandingCents + dueCents,
      }
    },
    { totalCents: 0, outstandingCents: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {customer.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.email ?? ""}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Invoiced", value: formatMoney(totals.totalCents, org.currency), icon: DollarSign },
          { label: "Outstanding", value: formatMoney(totals.outstandingCents, org.currency), icon: Calendar },
          { label: "Invoices", value: String(invoices.length), icon: FileText },
          { label: "Default Terms", value: `Net ${customer.defaultPaymentTermsDays}`, icon: Building2 },
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
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    No invoices yet
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const totals = computeInvoiceTotals(inv)
                  return (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-right text-foreground">
                        {formatMoney(totals.totalCents, org.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {inv.dueDate ? formatDate(inv.dueDate, org.timezone) : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
