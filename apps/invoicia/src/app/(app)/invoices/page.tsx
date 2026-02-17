import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatDate, formatMoney } from "@/lib/format"
import { InvoicesClient, type InvoiceRow } from "./client"

export default async function InvoicesPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true },
  })

  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    include: {
      customer: true,
      lineItems: true,
      payments: true,
      creditNotes: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const rows: InvoiceRow[] = invoices.map((inv) => {
    const totals = computeInvoiceTotals(inv)
    return {
      id: inv.id,
      number: inv.number,
      customerName: inv.customer.name,
      customerEmail: inv.customer.email,
      status: inv.status,
      amount: formatMoney(totals.totalCents, org.currency),
      issueDate: formatDate(inv.issueDate, org.timezone),
      dueDate: inv.dueDate ? formatDate(inv.dueDate, org.timezone) : null,
    }
  })

  return <InvoicesClient invoices={rows} />
}
