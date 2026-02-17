import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { unguessableToken } from "@/server/services/ids";

const lineItemInputSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().positive().default(1),
  unitPriceCents: z.coerce.number().int().min(0),
  unit: z.string().min(1).default("each"),
  taxCategory: z.string().optional(),
  taxPercent: z.coerce.number().int().min(0).max(50).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.coerce.number().int().min(0).optional(),
});

const invoiceInputSchema = z.object({
  customerId: z.string().min(1),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]).default("NGN"),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).default(14),
  dueDate: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  notes: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.coerce.number().int().min(0).optional(),
  taxLabel: z.string().optional(),
  taxPercent: z.coerce.number().int().min(0).max(50).optional(),
  lineItems: z.array(lineItemInputSchema).min(1),
});

function pad6(n: number) {
  return n.toString().padStart(6, "0");
}

export async function createDraftInvoice(params: {
  orgId: string;
  actorUserId: string;
  input: unknown;
}) {
  const data = invoiceInputSchema.parse(params.input);

  const invoice = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: params.orgId },
      data: { invoiceNextNumber: { increment: 1 } },
      select: { invoicePrefix: true, invoiceNextNumber: true, taxLabel: true, taxPercent: true },
    });

    const seq = org.invoiceNextNumber - 1;
    const year = new Date().getUTCFullYear();
    const number = `${org.invoicePrefix}-${year}-${pad6(seq)}`;

    const created = await tx.invoice.create({
      data: {
        orgId: params.orgId,
        customerId: data.customerId,
        number,
        token: unguessableToken(),
        currency: data.currency,
        paymentTermsDays: data.paymentTermsDays,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        purchaseOrderNumber: data.purchaseOrderNumber || null,
        notes: data.notes || null,
        discountType: data.discountType || null,
        discountValue: data.discountValue ?? null,
        taxLabel: data.taxLabel ?? org.taxLabel ?? null,
        taxPercent: data.taxPercent ?? org.taxPercent ?? null,
        lineItems: {
          create: data.lineItems.map((li) => ({
            productId: li.productId ?? null,
            description: li.description,
            quantity: new Prisma.Decimal(li.quantity),
            unitPriceCents: li.unitPriceCents,
            unit: li.unit,
            taxCategory: li.taxCategory ?? null,
            taxPercent: li.taxPercent ?? null,
            discountType: li.discountType ?? null,
            discountValue: li.discountValue ?? null,
          })),
        },
      },
      include: { lineItems: true, customer: true },
    });

    return created;
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { number: invoice.number },
  });

  return invoice;
}

