import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { computeAmountDueCents } from "@/server/services/invoice-finance";

export async function applyLateFee(params: { invoiceId: string; policyId: string }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      org: true,
      lineItems: true,
      payments: true,
      creditNotes: true,
    },
  });
  if (!invoice) return;

  const policy = await prisma.lateFeePolicy.findUnique({ where: { id: params.policyId } });
  if (!policy?.enabled) return;

  if (!invoice.dueDate) return;
  if (invoice.status === "PAID" || invoice.status === "VOID" || invoice.status === "DRAFT") return;

  const { dueCents } = computeAmountDueCents({
    invoice,
    lineItems: invoice.lineItems,
    payments: invoice.payments,
    creditNotes: invoice.creditNotes,
  });
  if (dueCents <= 0) return;

  const existing = await prisma.invoiceLateFeeApplication.findUnique({
    where: { invoiceId_policyId: { invoiceId: invoice.id, policyId: policy.id } },
  });
  if (existing) return;

  let feeCents = 0;
  if (policy.type === "FLAT") feeCents = policy.amountCents ?? 0;
  if (policy.type === "PERCENT") feeCents = Math.round((dueCents * (policy.percent ?? 0)) / 100);
  if (feeCents <= 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description: "Late fee",
        quantity: 1,
        unitPriceCents: feeCents,
        unit: "each",
        taxPercent: 0,
      },
    });
    await tx.invoiceLateFeeApplication.create({
      data: {
        orgId: invoice.orgId,
        invoiceId: invoice.id,
        policyId: policy.id,
        amountCents: feeCents,
      },
    });
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "OVERDUE" },
    });
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: null,
    action: "invoice.late_fee_applied",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { policyId: policy.id, amountCents: feeCents },
  });
}

