import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { isStripeConfigured } from "@/server/payments/stripe";
import { getPaymentProvider } from "@/server/payments/provider";
import { computeAmountDueCents } from "@/server/services/invoice-finance";
import { auditEvent } from "@/server/services/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { token } = await params;

  const rl = await rateLimit({ key: `public:pay:${ip}:${token}`, limit: 10, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { token },
    include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });

  if (invoice.status === "DRAFT" || invoice.status === "VOID") {
    return NextResponse.json({ ok: false, error: "Invoice is not payable." }, { status: 400 });
  }

  const { dueCents } = computeAmountDueCents({
    invoice,
    lineItems: invoice.lineItems,
    payments: invoice.payments,
    creditNotes: invoice.creditNotes,
  });
  if (dueCents <= 0) {
    return NextResponse.json({ ok: false, error: "Nothing due." }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const checkout = await provider.createInvoiceCheckout({
    invoiceId: invoice.id,
    token: invoice.token,
    orgId: invoice.orgId,
    invoiceNumber: invoice.number,
    amountCents: dueCents,
    currency: invoice.currency,
    buyerEmail: invoice.customer.email,
  });

  await prisma.payment.create({
    data: {
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      provider: checkout.provider,
      providerRef: checkout.providerRef,
      status: "PENDING",
      amountCents: dueCents,
      currency: invoice.currency,
      buyerEmail: invoice.customer.email,
    },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: null,
    action: "payment.attempted",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { provider: checkout.provider, sessionId: checkout.providerRef },
  });

  return NextResponse.redirect(checkout.url, 303);
}
