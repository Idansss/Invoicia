"use server";

import { revalidatePath } from "next/cache";

import { requireOrgRole } from "@/server/tenant";
import {
  convertQuoteToInvoice,
  createQuoteDraft,
  deleteQuoteDraft,
  sendQuote,
  updateQuoteDraft,
  voidQuote,
} from "@/server/services/quotes";

export async function createQuoteAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const quote = await createQuoteDraft({ orgId, actorUserId: userId, input });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quote.id}`);
  return { ok: true as const, quoteId: quote.id };
}

export async function sendQuoteAction(quoteId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  await sendQuote({ orgId, actorUserId: userId, quoteId });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function voidQuoteAction(quoteId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  await voidQuote({ orgId, actorUserId: userId, quoteId });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteQuoteAction(quoteId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  await deleteQuoteDraft({ orgId, actorUserId: userId, quoteId });
  revalidatePath("/quotes");
}

export async function convertQuoteAction(quoteId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const invoice = await convertQuoteToInvoice({ orgId, actorUserId: userId, quoteId });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  return { ok: true as const, invoiceId: invoice.id };
}

export async function updateQuoteAction(quoteId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  await updateQuoteDraft({ orgId, actorUserId: userId, quoteId, input });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}
