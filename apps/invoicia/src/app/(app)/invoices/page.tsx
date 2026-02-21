import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { formatDate, formatMoney } from "@/lib/format"
import { InvoicesClient, type InvoiceRow } from "./client"
import type { InvoiceStatus, Prisma } from "@prisma/client"

const PAGE_SIZE = 25

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const { search, status, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1)
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true },
  })

  const where: Prisma.InvoiceWhereInput = { orgId }
  if (status && status !== "all") {
    where.status = status.toUpperCase() as InvoiceStatus
  }
  if (search?.trim()) {
    where.OR = [
      { number: { contains: search.trim(), mode: "insensitive" } },
      { customer: { name: { contains: search.trim(), mode: "insensitive" } } },
    ]
  }

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { customer: true, lineItems: true, payments: true, creditNotes: true },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ])

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

  return (
    <InvoicesClient
      invoices={rows}
      totalCount={totalCount}
      pageSize={PAGE_SIZE}
      currentPage={currentPage}
      initialSearch={search ?? ""}
      initialStatus={status ?? "all"}
    />
  )
}
