import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { stripe } from "@/server/payments/stripe";
import { auditEvent } from "@/server/services/audit";
import { computeAmountDueCents } from "@/server/services/invoice-finance";
import { generateReceiptPdf, persistReceiptPdfArtifact } from "@/server/pdf/generate";
import { upsertExportArtifact } from "@/server/artifacts";
import { sendEmail } from "@/server/email/mailer";
import { ReceiptEmail } from "@/server/email/templates/receipt";
import { formatMoney } from "@/lib/format";

function receiptNumber() {
  const year = new Date().getUTCFullYear();
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `RCT-${year}-${rand}`;
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Webhook secret not configured." }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false }, { status: 400 });

  const body = Buffer.from(await req.arrayBuffer());
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any;
    const sessionId = session.id as string;
    const invoiceId = session.metadata?.invoiceId as string | undefined;
    if (!invoiceId) return NextResponse.json({ ok: true });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true },
    });
    if (!invoice) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findFirst({
      where: { provider: "stripe", providerRef: sessionId },
    });
    if (payment?.status === "SUCCEEDED") return NextResponse.json({ ok: true });

    const { dueCents } = computeAmountDueCents({
      invoice,
      lineItems: invoice.lineItems,
      payments: invoice.payments,
      creditNotes: invoice.creditNotes,
    });
    const amountPaid = Number(session.amount_total ?? dueCents);

    const updatedPayment = payment
      ? await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED" },
        })
      : await prisma.payment.create({
          data: {
            orgId: invoice.orgId,
            invoiceId: invoice.id,
            provider: "stripe",
            providerRef: sessionId,
            status: "SUCCEEDED",
            amountCents: amountPaid,
            currency: invoice.currency,
            buyerEmail: invoice.customer.email,
          },
        });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await auditEvent({
      orgId: invoice.orgId,
      actorUserId: null,
      action: "payment.succeeded",
      entityType: "Payment",
      entityId: updatedPayment.id,
      data: { provider: "stripe", sessionId },
    });
    await auditEvent({
      orgId: invoice.orgId,
      actorUserId: null,
      action: "invoice.paid",
      entityType: "Invoice",
      entityId: invoice.id,
      data: { provider: "stripe", sessionId },
    });

    const receipt = await prisma.receipt.create({
      data: {
        orgId: invoice.orgId,
        invoiceId: invoice.id,
        paymentId: updatedPayment.id,
        receiptNumber: receiptNumber(),
      },
    });

    const hostedUrl = `${env.APP_BASE_URL}/i/${invoice.token}`;
    const { bytes } = await generateReceiptPdf({
      orgName: invoice.org.name,
      invoiceNumber: invoice.number,
      receiptNumber: receipt.receiptNumber,
      currency: invoice.currency,
      paidCents: amountPaid,
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

    if (invoice.customer.email) {
      await sendEmail({
        to: invoice.customer.email,
        subject: `Receipt for ${invoice.number}`,
        react: ReceiptEmail({
          orgName: invoice.org.name,
          invoiceNumber: invoice.number,
          receiptNumber: receipt.receiptNumber,
          amountPaidFormatted: formatMoney(amountPaid, invoice.currency),
          hostedUrl,
        }),
        attachments: [{ filename: `${receipt.receiptNumber}.pdf`, content: bytes, contentType: "application/pdf" }],
      });
    }
  }

  return NextResponse.json({ received: true });
}
