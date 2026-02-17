import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Plus,
  TrendingUp,
  UserPlus,
} from "lucide-react"

import { PageHeader } from "@/components/app/page-header"
import { KpiCard } from "@/components/app/kpi-card"
import { QuickActions } from "@/components/app/quick-actions"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatDate, formatMoney } from "@/lib/format"
import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import {
  invoiceWithCustomerBalanceInclude,
  type InvoiceCreditNote,
  type InvoicePayment,
  type InvoiceWithCustomerBalance,
} from "@/types/invoice"

const quickActions = [
  { label: "Create invoice", icon: Plus, href: "/invoices/new" },
  { label: "Add customer", icon: UserPlus, href: "/customers" },
  { label: "Connect payments", icon: CreditCard, href: "/payments" },
  { label: "Set reminders", icon: Bell, href: "/reminders" },
]

export default async function AppOverviewPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const [org, invoices] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currency: true, timezone: true },
    }),
    prisma.invoice.findMany({
      where: { orgId },
      include: invoiceWithCustomerBalanceInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])
  const typedInvoices: InvoiceWithCustomerBalance[] = invoices

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let totalInvoicedCents = 0
  let openCents = 0
  let overdueCents = 0
  let paidThisMonthCents = 0

  for (const invoice of typedInvoices) {
    const totals = computeInvoiceTotals(invoice)
    const paidCents = invoice.payments
      .filter((payment: InvoicePayment) => payment.status === "SUCCEEDED")
      .reduce((sum: number, payment: InvoicePayment) => sum + payment.amountCents, 0)
    const creditsCents = invoice.creditNotes.reduce(
      (sum: number, note: InvoiceCreditNote) => sum + note.amountCents,
      0,
    )
    const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents)

    totalInvoicedCents += totals.totalCents

    if (invoice.status !== "PAID" && invoice.status !== "VOID") {
      openCents += dueCents
    }

    if (invoice.dueDate && invoice.dueDate < now && dueCents > 0) {
      overdueCents += dueCents
    }

    if (invoice.paidAt && invoice.paidAt >= monthStart) {
      paidThisMonthCents += totals.totalCents
    }
  }

  const activeCustomers = new Set(typedInvoices.map((invoice) => invoice.customerId)).size
  const recentInvoices = typedInvoices.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Structured invoices are canonical. PDFs are renderings. Hosted links are the buyer experience."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total invoiced"
          value={formatMoney(totalInvoicedCents, org.currency)}
          description="Across all invoices"
          icon={DollarSign}
        />
        <KpiCard
          title="Open invoices"
          value={formatMoney(openCents, org.currency)}
          description="Awaiting payment"
          icon={Clock}
        />
        <KpiCard
          title="Overdue"
          value={formatMoney(overdueCents, org.currency)}
          description="Needs follow-up"
          icon={TrendingUp}
        />
        <KpiCard
          title="Paid this month"
          value={formatMoney(paidThisMonthCents, org.currency)}
          description={`${activeCustomers} active customers`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Recent invoices</CardTitle>
              <CardDescription>Latest activity across your organization</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Invoice</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No invoices yet. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((invoice) => {
                    const totals = computeInvoiceTotals(invoice)
                    return (
                      <TableRow key={invoice.id} className="transition-colors hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{invoice.customer.name}</TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-foreground">
                          {formatMoney(totals.totalCents, org.currency)}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                          {invoice.dueDate ? formatDate(invoice.dueDate, org.timezone) : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Quick actions</CardTitle>
            <CardDescription>Start common flows in one click</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions actions={quickActions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
