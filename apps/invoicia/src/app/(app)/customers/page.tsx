import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatMoney } from "@/lib/format"
import { CustomersClient, type CustomerRow } from "./client"

export default async function CustomersPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true },
  })

  const [customers, invoices] = await Promise.all([
    prisma.customer.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({
      where: { orgId },
      include: { lineItems: true, payments: true, creditNotes: true },
    }),
  ])

  const totalsByCustomer = new Map<string, { totalCents: number; outstandingCents: number }>()
  invoices.forEach((inv) => {
    const totals = computeInvoiceTotals(inv)
    const paidCents = inv.payments
      .filter((p) => p.status === "SUCCEEDED")
      .reduce((s, p) => s + p.amountCents, 0)
    const creditsCents = inv.creditNotes.reduce((s, c) => s + c.amountCents, 0)
    const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents)
    const existing = totalsByCustomer.get(inv.customerId) || { totalCents: 0, outstandingCents: 0 }
    totalsByCustomer.set(inv.customerId, {
      totalCents: existing.totalCents + totals.totalCents,
      outstandingCents: existing.outstandingCents + dueCents,
    })
  })

  const rows: CustomerRow[] = customers.map((customer) => {
    const totals = totalsByCustomer.get(customer.id) ?? { totalCents: 0, outstandingCents: 0 }
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      defaultTerms: `Net ${customer.defaultPaymentTermsDays}`,
      totalInvoiced: formatMoney(totals.totalCents, org.currency),
      outstanding: formatMoney(totals.outstandingCents, org.currency),
      outstandingCents: totals.outstandingCents,
    }
  })

  return <CustomersClient customers={rows} />
}
