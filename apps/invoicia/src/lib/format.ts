import type { CurrencyCode } from "@prisma/client";

export function formatMoney(amountCents: number, currency: CurrencyCode) {
  const amount = amountCents / 100;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: timeZone || "UTC",
  }).format(value);
}

export function formatDateTime(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone || "UTC",
  }).format(value);
}
