import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDate, formatMoney } from "@/lib/format"
import { QuotesClient, type QuoteRow } from "./client"

export default async function QuotesPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true },
  })

  const quotes = await prisma.quote.findMany({
    where: { orgId },
    include: { customer: true, lineItems: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const rows: QuoteRow[] = quotes.map((quote) => {
    const totalCents = quote.lineItems.reduce(
      (sum, item) => sum + Number(item.quantity) * item.unitPriceCents,
      0
    )
    return {
      id: quote.id,
      number: quote.number,
      customerName: quote.customer.name,
      customerEmail: quote.customer.email,
      status: quote.status,
      amount: formatMoney(totalCents, org.currency),
      createdAt: formatDate(quote.createdAt, org.timezone),
      expiresAt: quote.expiresAt ? formatDate(quote.expiresAt, org.timezone) : null,
    }
  })

  return <QuotesClient quotes={rows} />
}
