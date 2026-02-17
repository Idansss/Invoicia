"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgRole } from "@/server/tenant";
import { createDraftInvoice } from "@/server/services/invoices";
import { sendInvoice } from "@/server/services/send-invoice";

export async function createInvoiceAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole([
    "OWNER",
    "ADMIN",
    "ACCOUNTANT",
    "STAFF",
  ]);
  const payload = input as Record<string, unknown> & { sendNow?: boolean };
  const sendNow = Boolean(payload.sendNow);
  const invoiceInput = { ...payload };
  delete invoiceInput.sendNow;

  const invoice = await createDraftInvoice({ orgId, actorUserId: userId, input: invoiceInput });
  if (sendNow) {
    await sendInvoice({ orgId, actorUserId: userId, invoiceId: invoice.id });
  }
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  redirect(`/invoices/${invoice.id}`);
}
