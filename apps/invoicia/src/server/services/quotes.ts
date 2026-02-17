import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { unguessableToken } from "@/server/services/ids";

const createQuoteSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  expiresAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

const updateQuoteSchema = z.object({
  expiresAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

function pad6(value: number) {
  return value.toString().padStart(6, "0");
}

async function ensureQuoteBelongsToOrg(tx: Prisma.TransactionClient, orgId: string, quoteId: string) {
  const quote = await tx.quote.findFirst({
    where: { id: quoteId, orgId },
    include: { lineItems: true, customer: true, org: true },
  });
  if (!quote) throw new Error("Quote not found.");
  return quote;
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  params: { orgId: string; customerId?: string; customerName?: string; customerEmail?: string },
) {
  if (params.customerId) {
    const existing = await tx.customer.findFirst({
      where: { id: params.customerId, orgId: params.orgId },
    });
    if (!existing) throw new Error("Customer not found.");
    return existing;
  }

  const name = params.customerName?.trim();
  if (!name) throw new Error("Customer name is required.");
  const normalizedEmail = params.customerEmail?.trim().toLowerCase();

  if (normalizedEmail) {
    const byEmail = await tx.customer.findFirst({
      where: { orgId: params.orgId, email: normalizedEmail },
    });
    if (byEmail) return byEmail;
  }

  return tx.customer.create({
    data: {
      orgId: params.orgId,
      name,
      email: normalizedEmail ?? null,
    },
  });
}

async function nextQuoteNumber(tx: Prisma.TransactionClient, orgId: string) {
  const year = new Date().getUTCFullYear();
  const count = await tx.quote.count({ where: { orgId } });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sequence = count + 1 + attempt;
    const number = `QTE-${year}-${pad6(sequence)}`;
    const exists = await tx.quote.findUnique({ where: { orgId_number: { orgId, number } }, select: { id: true } });
    if (!exists) return number;
  }
  return `QTE-${year}-${Date.now()}`;
}

export async function createQuoteDraft(params: { orgId: string; actorUserId: string; input: unknown }) {
  const data = createQuoteSchema.parse(params.input);
  const quote = await prisma.$transaction(async (tx) => {
    const [org, customer] = await Promise.all([
      tx.organization.findUniqueOrThrow({ where: { id: params.orgId }, select: { currency: true } }),
      resolveCustomer(tx, {
        orgId: params.orgId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      }),
    ]);

    const number = await nextQuoteNumber(tx, params.orgId);
    return tx.quote.create({
      data: {
        orgId: params.orgId,
        customerId: customer.id,
        number,
        currency: org.currency,
        notes: data.notes?.trim() || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: { customer: true, lineItems: true },
    });
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "quote.created",
    entityType: "Quote",
    entityId: quote.id,
    data: { number: quote.number },
  });

  return quote;
}

export async function sendQuote(params: { orgId: string; actorUserId: string; quoteId: string }) {
  const quote = await prisma.quote.findFirst({
    where: { id: params.quoteId, orgId: params.orgId },
    select: { id: true, orgId: true, status: true },
  });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status === "VOID") throw new Error("Cannot send a void quote.");

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "SENT" },
  });

  await auditEvent({
    orgId: quote.orgId,
    actorUserId: params.actorUserId,
    action: "quote.sent",
    entityType: "Quote",
    entityId: quote.id,
  });
}

export async function voidQuote(params: { orgId: string; actorUserId: string; quoteId: string }) {
  const quote = await prisma.quote.findFirst({
    where: { id: params.quoteId, orgId: params.orgId },
    select: { id: true, orgId: true, status: true },
  });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status === "CONVERTED") throw new Error("Cannot void a converted quote.");

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "VOID" },
  });

  await auditEvent({
    orgId: quote.orgId,
    actorUserId: params.actorUserId,
    action: "quote.voided",
    entityType: "Quote",
    entityId: quote.id,
  });
}

export async function updateQuoteDraft(params: {
  orgId: string;
  actorUserId: string;
  quoteId: string;
  input: unknown;
}) {
  const data = updateQuoteSchema.parse(params.input);
  const quote = await prisma.quote.findFirst({
    where: { id: params.quoteId, orgId: params.orgId },
    select: { id: true, orgId: true, status: true },
  });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status === "CONVERTED" || quote.status === "VOID") {
    throw new Error("This quote can no longer be edited.");
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      notes: data.notes?.trim() || null,
    },
  });

  await auditEvent({
    orgId: quote.orgId,
    actorUserId: params.actorUserId,
    action: "quote.updated",
    entityType: "Quote",
    entityId: quote.id,
  });
}

export async function deleteQuoteDraft(params: { orgId: string; actorUserId: string; quoteId: string }) {
  const quote = await prisma.quote.findFirst({
    where: { id: params.quoteId, orgId: params.orgId },
    select: { id: true, orgId: true, status: true },
  });
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "DRAFT") throw new Error("Only draft quotes can be deleted.");

  await prisma.quote.delete({ where: { id: quote.id } });

  await auditEvent({
    orgId: quote.orgId,
    actorUserId: params.actorUserId,
    action: "quote.deleted",
    entityType: "Quote",
    entityId: quote.id,
  });
}

export async function convertQuoteToInvoice(params: { orgId: string; actorUserId: string; quoteId: string }) {
  const invoice = await prisma.$transaction(async (tx) => {
    const quote = await ensureQuoteBelongsToOrg(tx, params.orgId, params.quoteId);
    if (quote.status === "VOID") throw new Error("Cannot convert a void quote.");
    if (quote.status === "CONVERTED") throw new Error("Quote has already been converted.");

    const org = await tx.organization.update({
      where: { id: params.orgId },
      data: { invoiceNextNumber: { increment: 1 } },
      select: { invoicePrefix: true, invoiceNextNumber: true, taxLabel: true, taxPercent: true },
    });

    const seq = org.invoiceNextNumber - 1;
    const year = new Date().getUTCFullYear();
    const invoiceNumber = `${org.invoicePrefix}-${year}-${pad6(seq)}`;
    const lineItems = quote.lineItems.length
      ? quote.lineItems
      : [
          {
            description: quote.notes?.slice(0, 200) || `Converted from ${quote.number}`,
            quantity: new Prisma.Decimal(1),
            unitPriceCents: 0,
            unit: "each",
            taxCategory: null,
            taxPercent: null,
            discountType: null,
            discountValue: null,
            productId: null,
            id: "draft",
            quoteId: quote.id,
          },
        ];

    const createdInvoice = await tx.invoice.create({
      data: {
        orgId: params.orgId,
        customerId: quote.customerId,
        number: invoiceNumber,
        token: unguessableToken(),
        currency: quote.currency,
        paymentTermsDays: 14,
        notes: quote.notes || null,
        taxLabel: org.taxLabel ?? null,
        taxPercent: org.taxPercent ?? null,
        lineItems: {
          create: lineItems.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: new Prisma.Decimal(line.quantity),
            unitPriceCents: line.unitPriceCents,
            unit: line.unit,
            taxCategory: line.taxCategory,
            taxPercent: line.taxPercent,
            discountType: line.discountType,
            discountValue: line.discountValue,
          })),
        },
      },
      select: { id: true },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "CONVERTED" },
    });

    return createdInvoice;
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "quote.converted",
    entityType: "Quote",
    entityId: params.quoteId,
    data: { invoiceId: invoice.id },
  });

  return invoice;
}
