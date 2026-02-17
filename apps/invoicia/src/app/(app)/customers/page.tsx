import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatMoney } from "@/lib/format"
import { CustomersClient, type CustomerRow } from "./client"
import {
  invoiceBalanceInclude,
  type InvoiceCreditNote,
  type InvoicePayment,
  type InvoiceWithBalance,
} from "@/types/invoice"

type CustomerRecord = {
  id: string
  name: string
  email: string | null
  defaultPaymentTermsDays: number
}

export default async function CustomersPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true },
  })

  const customersPromise: Promise<CustomerRecord[]> = prisma.customer.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      defaultPaymentTermsDays: true,
    },
  }) as unknown as Promise<CustomerRecord[]>

  const invoicesPromise = prisma.invoice.findMany({
    where: { orgId },
    include: invoiceBalanceInclude,
  })

  const [customers, invoices] = await Promise.all([customersPromise, invoicesPromise])
  const typedInvoices: InvoiceWithBalance[] = invoices

  const totalsByCustomer = new Map<string, { totalCents: number; outstandingCents: number }>()
  typedInvoices.forEach((inv) => {
    const totals = computeInvoiceTotals(inv)
    const paidCents = inv.payments
      .filter((p: InvoicePayment) => p.status === "SUCCEEDED")
      .reduce((s: number, p: InvoicePayment) => s + p.amountCents, 0)
    const creditsCents = inv.creditNotes.reduce(
      (s: number, c: InvoiceCreditNote) => s + c.amountCents,
      0,
    )
    const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents)
    const existing = totalsByCustomer.get(inv.customerId) || { totalCents: 0, outstandingCents: 0 }
    totalsByCustomer.set(inv.customerId, {
      totalCents: existing.totalCents + totals.totalCents,
      outstandingCents: existing.outstandingCents + dueCents,
    })
  })

  const rows: CustomerRow[] = customers.map((customer: CustomerRecord) => {
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
