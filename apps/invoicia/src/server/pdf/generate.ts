import QRCode from "qrcode";

import type { Invoice, InvoiceLineItem, Organization, Customer, Payment, CreditNote, CurrencyCode } from "@prisma/client";
import { computeInvoiceTotals } from "@/domain/invoice-calculations";
import { formatDate } from "@/lib/format";
import { renderPdfToBuffer, writeArtifact } from "@/server/pdf/render";
import { InvoiceClassicPdf } from "@/server/pdf/templates/invoice-classic";
import { InvoiceModernPdf } from "@/server/pdf/templates/invoice-modern";
import { ReceiptPdf } from "@/server/pdf/templates/receipt";
import type { InvoicePdfData, ReceiptPdfData } from "@/server/pdf/types";

type InvoiceFull = Invoice & {
  org: Organization;
  customer: Customer;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  creditNotes: CreditNote[];
};

function addressString(a: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
}) {
  const parts = [a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, a.countryCode].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

export async function generateInvoicePdf(params: {
  invoice: InvoiceFull;
  hostedUrl: string;
  template: "modern" | "classic";
}) {
  const totals = computeInvoiceTotals(params.invoice);
  const paidCents = params.invoice.payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((s, p) => s + p.amountCents, 0);
  const creditsCents = params.invoice.creditNotes.reduce((s, c) => s + c.amountCents, 0);
  const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents);

  const qrPayload = JSON.stringify({
    url: params.hostedUrl,
    invoice: params.invoice.number,
    amountDueCents: dueCents,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200 });

  const data: InvoicePdfData = {
    org: {
      name: params.invoice.org.name,
      address: addressString(params.invoice.org),
      email: params.invoice.org.email ?? undefined,
      phone: params.invoice.org.phone ?? undefined,
      taxLabel: params.invoice.org.taxLabel ?? undefined,
      taxId: params.invoice.org.taxId ?? undefined,
    },
    customer: {
      name: params.invoice.customer.name,
      email: params.invoice.customer.email ?? undefined,
      address: addressString(params.invoice.customer),
      taxId: params.invoice.customer.taxId ?? undefined,
    },
    invoice: {
      number: params.invoice.number,
      status: params.invoice.status,
      issueDate: formatDate(params.invoice.issueDate, params.invoice.org.timezone),
      dueDate: params.invoice.dueDate ? formatDate(params.invoice.dueDate, params.invoice.org.timezone) : undefined,
      currency: params.invoice.currency,
      notes: params.invoice.notes ?? undefined,
    },
    totals: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      discountCents: totals.invoiceDiscountCents,
      totalCents: totals.totalCents,
      paidCents,
      dueCents,
    },
    lines: params.invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity.toString(),
      unit: li.unit,
      unitPriceCents: li.unitPriceCents,
      lineTotalCents: Math.round(Number(li.quantity.toString()) * li.unitPriceCents),
      taxPercent: li.taxPercent ?? params.invoice.taxPercent ?? 0,
    })),
    hostedUrl: params.hostedUrl,
    qrDataUrl,
    template: params.template,
  };

  const doc = params.template === "classic" ? InvoiceClassicPdf(data) : InvoiceModernPdf(data);
  const bytes = await renderPdfToBuffer(doc);
  return { bytes, dueCents };
}

export async function generateReceiptPdf(params: {
  orgName: string;
  invoiceNumber: string;
  receiptNumber: string;
  currency: CurrencyCode;
  paidCents: number;
  paidAt: Date;
  hostedUrl: string;
  template: "modern" | "classic";
}) {
  const data: ReceiptPdfData = {
    orgName: params.orgName,
    invoiceNumber: params.invoiceNumber,
    receiptNumber: params.receiptNumber,
    currency: params.currency,
    paidCents: params.paidCents,
    paidAt: formatDate(params.paidAt, "UTC"),
    hostedUrl: params.hostedUrl,
    template: params.template,
  };
  const bytes = await renderPdfToBuffer(ReceiptPdf(data));
  return { bytes };
}

export async function persistInvoicePdfArtifact(params: {
  orgId: string;
  invoiceId: string;
  template: "modern" | "classic";
  bytes: Buffer;
}) {
  const { storagePath } = await writeArtifact({
    subdir: `invoices/${params.invoiceId}`,
    filename: `invoice-${params.template}.pdf`,
    bytes: params.bytes,
  });
  return storagePath;
}

export async function persistReceiptPdfArtifact(params: {
  receiptId: string;
  bytes: Buffer;
}) {
  const { storagePath } = await writeArtifact({
    subdir: `receipts/${params.receiptId}`,
    filename: `receipt.pdf`,
    bytes: params.bytes,
  });
  return storagePath;
}
