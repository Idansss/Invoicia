import { notFound } from "next/navigation"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDate, formatMoney } from "@/lib/format"
import { QuoteDetailClient } from "./client"

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const quote = await prisma.quote.findFirst({
    where: { id, orgId },
    include: {
      customer: true,
      lineItems: true,
      org: { select: { timezone: true } },
    },
  })

  if (!quote) notFound()

  const totalCents = quote.lineItems.reduce(
    (sum, item) => sum + Number(item.quantity) * item.unitPriceCents,
    0,
  )

  return (
    <QuoteDetailClient
      quote={{
        id: quote.id,
        number: quote.number,
        status: quote.status,
        customerName: quote.customer.name,
        customerEmail: quote.customer.email,
        createdAt: formatDate(quote.createdAt, quote.org.timezone),
        expiresAtRaw: quote.expiresAt ? quote.expiresAt.toISOString().slice(0, 10) : "",
        expiresAt: quote.expiresAt ? formatDate(quote.expiresAt, quote.org.timezone) : null,
        notes: quote.notes ?? "",
        amount: formatMoney(totalCents, quote.currency),
        lineItems: quote.lineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPriceCents: item.unitPriceCents,
          unit: item.unit,
        })),
      }}
      currency={quote.currency}
    />
  )
}
