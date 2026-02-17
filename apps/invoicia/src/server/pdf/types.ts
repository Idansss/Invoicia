import type { CurrencyCode, InvoiceStatus } from "@prisma/client";

export type InvoicePdfLine = {
  description: string;
  quantity: string;
  unit: string;
  unitPriceCents: number;
  lineTotalCents: number;
  taxPercent: number;
};

export type InvoicePdfData = {
  org: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    taxLabel?: string;
    taxId?: string;
  };
  customer: {
    name: string;
    email?: string;
    address?: string;
    taxId?: string;
  };
  invoice: {
    number: string;
    status: InvoiceStatus;
    issueDate: string;
    dueDate?: string;
    currency: CurrencyCode;
    notes?: string;
  };
  totals: {
    subtotalCents: number;
    taxCents: number;
    discountCents: number;
    totalCents: number;
    paidCents: number;
    dueCents: number;
  };
  lines: InvoicePdfLine[];
  hostedUrl: string;
  qrDataUrl?: string;
  template: "modern" | "classic";
};

export type ReceiptPdfData = {
  orgName: string;
  invoiceNumber: string;
  receiptNumber: string;
  currency: CurrencyCode;
  paidCents: number;
  paidAt: string;
  hostedUrl: string;
  template: "modern" | "classic";
};

