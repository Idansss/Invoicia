import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDate, formatMoney } from "@/lib/format"
import { PaymentsClient, type PaymentRow } from "./client"

export default async function PaymentsPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true },
  })

  const payments = await prisma.payment.findMany({
    where: { orgId },
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const rows: PaymentRow[] = payments.map((p) => ({
    id: p.id,
    invoiceId: p.invoiceId,
    invoiceNumber: p.invoice.number,
    customerName: p.invoice.customer.name,
    amount: formatMoney(p.amountCents, org.currency),
    status: p.status,
    method: p.provider,
    date: formatDate(p.createdAt, org.timezone),
  }))

  const sumByStatus = (statuses: string[]) => {
    const filtered = payments.filter((p) => statuses.includes(p.status))
    const totalCents = filtered.reduce((sum, p) => sum + p.amountCents, 0)
    return { totalCents, count: filtered.length }
  }

  const successful = sumByStatus(["SUCCEEDED"])
  const failed = sumByStatus(["FAILED"])
  const pending = sumByStatus(["PENDING", "REQUIRES_PAYMENT_METHOD"])

  const summary = {
    successful: { total: formatMoney(successful.totalCents, org.currency), count: successful.count },
    failed: { total: formatMoney(failed.totalCents, org.currency), count: failed.count },
    pending: { total: formatMoney(pending.totalCents, org.currency), count: pending.count },
  }

  return <PaymentsClient payments={rows} summary={summary} />
}
