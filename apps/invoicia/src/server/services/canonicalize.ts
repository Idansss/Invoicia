import type { CanonicalInvoice } from "@/compliance/core/types";
import type { CreditNote, Customer, Invoice, InvoiceLineItem, Organization, Payment } from "@prisma/client";

export function toCanonicalInvoice(params: {
  org: Organization;
  customer: Customer;
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
}) : CanonicalInvoice {
  return {
    org: {
      name: params.org.name,
      countryCode: params.org.countryCode ?? null,
      taxId: params.org.taxId ?? null,
      currency: params.org.currency,
    },
    customer: {
      name: params.customer.name,
      email: params.customer.email ?? null,
      countryCode: params.customer.countryCode ?? null,
      taxId: params.customer.taxId ?? null,
    },
    invoice: {
      id: params.invoice.id,
      number: params.invoice.number,
      issueDate: params.invoice.issueDate,
      dueDate: params.invoice.dueDate,
      currency: params.invoice.currency,
      notes: params.invoice.notes,
    },
    lineItems: params.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity.toString(),
      unitPriceCents: li.unitPriceCents,
      taxPercent: li.taxPercent ?? params.invoice.taxPercent ?? 0,
    })),
  };
}

export function sumPaidCents(payments: Payment[]) {
  return payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amountCents, 0);
}

export function sumCreditsCents(creditNotes: CreditNote[]) {
  return creditNotes.reduce((s, c) => s + c.amountCents, 0);
}

