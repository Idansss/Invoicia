import { notFound } from "next/navigation"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { computeInvoiceTotals } from "@/domain/invoice-calculations"
import { InvoiceDetailClient } from "./client"
import { type InvoiceCreditNote, type InvoicePayment } from "@/types/invoice"

type InvoiceLineItemView = {
  id: string
  description: string
  quantity: { toString(): string }
  unitPriceCents: number
  taxPercent: number | null
  unit: string
}

type InvoiceDisputeView = {
  id: string
  status: "OPEN" | "APPROVED" | "REJECTED" | "CLOSED"
  reasonCode: string
  message: string | null
  createdAt: Date
}

type InvoiceExportArtifactView = {
  id: string
  kind: string
  storagePath: string
}

type InvoiceAttachmentView = {
  id: string
  filename: string
  storagePath: string
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, timezone: true, complianceProfile: true },
  })

  const invoice = await prisma.invoice.findFirst({
    where: { id, orgId },
    include: {
      customer: true,
      lineItems: true,
      payments: true,
      creditNotes: true,
      disputes: { orderBy: { createdAt: "desc" } },
      exportArtifacts: { orderBy: { createdAt: "desc" }, take: 5 },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!invoice) return notFound()

  const totals = computeInvoiceTotals(invoice)
  const paidCents = invoice.payments
    .filter((p: InvoicePayment) => p.status === "SUCCEEDED")
    .reduce((s: number, p: InvoicePayment) => s + p.amountCents, 0)
  const creditsCents = invoice.creditNotes.reduce(
    (s: number, c: InvoiceCreditNote) => s + c.amountCents,
    0,
  )
  const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents)

  return (
    <InvoiceDetailClient
      invoice={{
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        customerName: invoice.customer.name,
        customerEmail: invoice.customer.email,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
        notes: invoice.notes,
        poNumber: invoice.purchaseOrderNumber,
        token: invoice.token,
        terms: invoice.paymentTermsDays ? `Net ${invoice.paymentTermsDays}` : null,
        complianceProfile: org.complianceProfile,
        lineItems: invoice.lineItems.map((li: InvoiceLineItemView) => ({
          id: li.id,
          description: li.description,
          quantity: Number(li.quantity.toString()),
          unitPriceCents: li.unitPriceCents,
          taxPercent: li.taxPercent ?? invoice.taxPercent ?? 0,
          unit: li.unit,
        })),
        disputes: invoice.disputes.map((dispute: InvoiceDisputeView) => ({
          id: dispute.id,
          status: dispute.status,
          reasonCode: dispute.reasonCode,
          message: dispute.message,
          createdAt: dispute.createdAt.toISOString(),
        })),
        exportArtifacts: invoice.exportArtifacts.map((artifact: InvoiceExportArtifactView) => ({
          id: artifact.id,
          kind: artifact.kind,
          storagePath: artifact.storagePath,
        })),
        attachments: invoice.attachments.map((file: InvoiceAttachmentView) => ({
          id: file.id,
          filename: file.filename,
          storagePath: file.storagePath,
        })),
      }}
      totals={{
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        discountCents: totals.invoiceDiscountCents,
        totalCents: totals.totalCents,
        paidCents,
        creditsCents,
        dueCents,
      }}
      currency={org.currency}
      timezone={org.timezone}
    />
  )
}
