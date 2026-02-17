import type { CreditNote, Invoice, InvoiceLineItem, Payment } from "@prisma/client";

import { computeInvoiceTotals } from "@/domain/invoice-calculations";

export function computeAmountDueCents(params: {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  creditNotes: CreditNote[];
}) {
  const totals = computeInvoiceTotals({ ...params.invoice, lineItems: params.lineItems });
  const paidCents = params.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((s, p) => s + p.amountCents, 0);
  const creditsCents = params.creditNotes.reduce((s, c) => s + c.amountCents, 0);
  const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents);
  return { totals, paidCents, creditsCents, dueCents };
}

