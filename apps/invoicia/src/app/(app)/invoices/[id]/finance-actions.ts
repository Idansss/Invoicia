"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOrgRole } from "@/server/tenant";
import { issueCreditNote, recordManualPayment, voidInvoice } from "@/server/services/invoice-admin";

export async function voidInvoiceAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  await voidInvoice({ orgId, actorUserId: userId, invoiceId });
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

const creditSchema = z.object({
  amountCents: z.coerce.number().int().min(1),
  reason: z.string().max(200).optional(),
});

export async function createCreditNoteAction(invoiceId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"]);
  const data = creditSchema.parse(input);
  await issueCreditNote({ orgId, actorUserId: userId, invoiceId, amountCents: data.amountCents, reason: data.reason });
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

const paymentSchema = z.object({
  amountCents: z.coerce.number().int().min(1),
});

export async function recordManualPaymentAction(invoiceId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"]);
  const data = paymentSchema.parse(input);
  await recordManualPayment({ orgId, actorUserId: userId, invoiceId, amountCents: data.amountCents });
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

