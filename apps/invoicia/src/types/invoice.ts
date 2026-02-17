import { Prisma } from "@prisma/client";

export const invoiceBalanceInclude = Prisma.validator<Prisma.InvoiceInclude>()({
  lineItems: true,
  payments: true,
  creditNotes: true,
});

export const invoiceWithCustomerBalanceInclude = Prisma.validator<Prisma.InvoiceInclude>()({
  customer: true,
  ...invoiceBalanceInclude,
});

export type InvoiceWithBalance = Prisma.InvoiceGetPayload<{
  include: typeof invoiceBalanceInclude;
}>;

export type InvoiceWithCustomerBalance = Prisma.InvoiceGetPayload<{
  include: typeof invoiceWithCustomerBalanceInclude;
}>;

export type InvoicePayment = InvoiceWithBalance["payments"][number];
export type InvoiceCreditNote = InvoiceWithBalance["creditNotes"][number];
