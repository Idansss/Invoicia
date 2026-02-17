import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { computeAmountDueCents } from "@/server/services/invoice-finance";
import { env } from "@/server/env";
import { generateReceiptPdf, persistReceiptPdfArtifact } from "@/server/pdf/generate";
import { upsertExportArtifact } from "@/server/artifacts";
import { sendEmail } from "@/server/email/mailer";
import { ReceiptEmail } from "@/server/email/templates/receipt";
import { formatMoney } from "@/lib/format";

function randomCode() {
  return Math.random().toString(16).slice(2, 8).toUpperCase();
}

function pad6(value: number) {
  return value.toString().padStart(6, "0");
}

export async function voidInvoice(params: { orgId: string; actorUserId: string; invoiceId: string }) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, orgId: params.orgId },
    select: { id: true, orgId: true, status: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "PAID") throw new Error("Cannot void a paid invoice in MVP.");

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "VOID", voidedAt: new Date() },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: params.actorUserId,
    action: "invoice.voided",
    entityType: "Invoice",
    entityId: invoice.id,
  });
}

export async function duplicateInvoice(params: { orgId: string; actorUserId: string; invoiceId: string }) {
  const duplicated = await prisma.$transaction(async (tx) => {
    const source = await tx.invoice.findFirst({
      where: { id: params.invoiceId, orgId: params.orgId },
      include: { lineItems: true },
    });
    if (!source) throw new Error("Invoice not found.");

    const org = await tx.organization.update({
      where: { id: params.orgId },
      data: { invoiceNextNumber: { increment: 1 } },
      select: { invoicePrefix: true, invoiceNextNumber: true },
    });

    const seq = org.invoiceNextNumber - 1;
    const year = new Date().getUTCFullYear();
    const number = `${org.invoicePrefix}-${year}-${pad6(seq)}`;

    return tx.invoice.create({
      data: {
        orgId: source.orgId,
        customerId: source.customerId,
        number,
        token: `${source.token}-${randomCode().toLowerCase()}`,
        status: "DRAFT",
        currency: source.currency,
        issueDate: new Date(),
        dueDate: source.dueDate,
        paymentTermsDays: source.paymentTermsDays,
        purchaseOrderNumber: source.purchaseOrderNumber,
        notes: source.notes,
        discountType: source.discountType,
        discountValue: source.discountValue,
        taxLabel: source.taxLabel,
        taxPercent: source.taxPercent,
        lineItems: {
          create: source.lineItems.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
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
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "invoice.duplicated",
    entityType: "Invoice",
    entityId: duplicated.id,
    data: { sourceInvoiceId: params.invoiceId },
  });

  return duplicated;
}

export async function issueCreditNote(params: {
  orgId: string;
  actorUserId: string;
  invoiceId: string;
  amountCents: number;
  reason?: string;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, orgId: params.orgId },
    select: { id: true, orgId: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (params.amountCents <= 0) throw new Error("Amount must be positive.");

  const year = new Date().getUTCFullYear();
  const number = `CN-${year}-${randomCode()}`;

  const credit = await prisma.creditNote.create({
    data: {
      orgId: params.orgId,
      invoiceId: invoice.id,
      number,
      amountCents: params.amountCents,
      reason: params.reason || null,
    },
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "credit_note.issued",
    entityType: "CreditNote",
    entityId: credit.id,
    data: { invoiceId: invoice.id, amountCents: credit.amountCents },
  });

  return credit;
}

export async function recordManualPayment(params: {
  orgId: string;
  actorUserId: string;
  invoiceId: string;
  amountCents: number;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, orgId: params.orgId },
    include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (params.amountCents <= 0) throw new Error("Amount must be positive.");

  const payment = await prisma.payment.create({
    data: {
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      provider: "manual",
      providerRef: `manual-${randomCode()}`,
      status: "SUCCEEDED",
      amountCents: params.amountCents,
      currency: invoice.currency,
      buyerEmail: invoice.customer.email,
    },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: params.actorUserId,
    action: "payment.manual_recorded",
    entityType: "Payment",
    entityId: payment.id,
    data: { amountCents: payment.amountCents },
  });

  const { dueCents } = computeAmountDueCents({
    invoice,
    lineItems: invoice.lineItems,
    payments: [...invoice.payments, payment],
    creditNotes: invoice.creditNotes,
  });

  if (dueCents === 0) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    const receipt = await prisma.receipt.create({
      data: {
        orgId: invoice.orgId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        receiptNumber: `RCT-${new Date().getUTCFullYear()}-${randomCode()}`,
      },
    });

    const hostedUrl = `${env.APP_BASE_URL}/i/${invoice.token}`;
    const { bytes } = await generateReceiptPdf({
      orgName: invoice.org.name,
      invoiceNumber: invoice.number,
      receiptNumber: receipt.receiptNumber,
      currency: invoice.currency,
      paidCents: payment.amountCents,
      paidAt: new Date(),
      hostedUrl,
      template: "modern",
    });
    const pdfPath = await persistReceiptPdfArtifact({ receiptId: receipt.id, bytes });
    await prisma.receipt.update({ where: { id: receipt.id }, data: { pdfPath } });
    await upsertExportArtifact({
      orgId: invoice.orgId,
      receiptId: receipt.id,
      kind: "RECEIPT_PDF",
      storagePath: pdfPath,
      mimeType: "application/pdf",
      byteSize: bytes.byteLength,
    });

    await auditEvent({
      orgId: invoice.orgId,
      actorUserId: params.actorUserId,
      action: "invoice.paid",
      entityType: "Invoice",
      entityId: invoice.id,
      data: { provider: "manual" },
    });

    if (invoice.customer.email) {
      await sendEmail({
        to: invoice.customer.email,
        subject: `Receipt for ${invoice.number}`,
        react: ReceiptEmail({
          orgName: invoice.org.name,
          invoiceNumber: invoice.number,
          receiptNumber: receipt.receiptNumber,
          amountPaidFormatted: formatMoney(payment.amountCents, invoice.currency),
          hostedUrl,
        }),
        attachments: [
          {
            filename: `${receipt.receiptNumber}.pdf`,
            content: bytes,
            contentType: "application/pdf",
          },
        ],
      });
    }
  }

  return payment;
}
