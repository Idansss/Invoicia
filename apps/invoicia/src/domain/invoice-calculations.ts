import { Prisma } from "@prisma/client";

export type LineLike = {
  quantity: Prisma.Decimal;
  unitPriceCents: number;
  taxPercent?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
};

export type InvoiceLike = {
  lineItems: LineLike[];
  discountType?: string | null;
  discountValue?: number | null;
  taxPercent?: number | null;
};

function roundCents(decimal: Prisma.Decimal) {
  // ROUND_HALF_UP to 0 decimals
  // Prisma.Decimal is decimal.js-compatible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Number((decimal as any).toDecimalPlaces(0, (Prisma.Decimal as any).ROUND_HALF_UP).toString());
}

function percentOf(amountCents: number, percentWhole: number) {
  const d = new Prisma.Decimal(amountCents).mul(percentWhole).div(100);
  return roundCents(d);
}

export function computeLine(line: LineLike, fallbackTaxPercent: number | null | undefined) {
  const qty = line.quantity ?? new Prisma.Decimal(0);
  const net = new Prisma.Decimal(line.unitPriceCents).mul(qty);
  const netCents = roundCents(net);

  let discountCents = 0;
  if (line.discountType === "PERCENT" && typeof line.discountValue === "number") {
    discountCents = percentOf(netCents, line.discountValue);
  }
  if (line.discountType === "FIXED" && typeof line.discountValue === "number") {
    discountCents = Math.max(0, Math.min(netCents, line.discountValue));
  }

  const subtotalCents = Math.max(0, netCents - discountCents);
  const effectiveTax = typeof line.taxPercent === "number" ? line.taxPercent : fallbackTaxPercent ?? 0;
  const taxCents = effectiveTax > 0 ? percentOf(subtotalCents, effectiveTax) : 0;

  return {
    netCents,
    discountCents,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    effectiveTaxPercent: effectiveTax,
  };
}

export function computeInvoiceTotals(invoice: InvoiceLike) {
  const lines = invoice.lineItems.map((li) => computeLine(li, invoice.taxPercent ?? null));
  const subtotalCents = lines.reduce((sum, l) => sum + l.subtotalCents, 0);
  const taxCents = lines.reduce((sum, l) => sum + l.taxCents, 0);

  // MVP: invoice-level discounts are applied on the grand total.
  // TODO (Phase 2): allocate discounts per tax category and adjust tax base.
  const preDiscountTotalCents = subtotalCents + taxCents;
  let invoiceDiscountCents = 0;
  if (invoice.discountType === "PERCENT" && typeof invoice.discountValue === "number") {
    invoiceDiscountCents = percentOf(preDiscountTotalCents, invoice.discountValue);
  }
  if (invoice.discountType === "FIXED" && typeof invoice.discountValue === "number") {
    invoiceDiscountCents = Math.max(0, Math.min(preDiscountTotalCents, invoice.discountValue));
  }

  const totalCents = Math.max(0, preDiscountTotalCents - invoiceDiscountCents);
  return {
    subtotalCents,
    taxCents,
    invoiceDiscountCents,
    totalCents,
    lines,
  };
}

