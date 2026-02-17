"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgRole } from "@/server/tenant";
import { sendInvoice } from "@/server/services/send-invoice";

export async function sendInvoiceAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole([
    "OWNER",
    "ADMIN",
    "ACCOUNTANT",
    "STAFF",
  ]);
  await sendInvoice({ orgId, actorUserId: userId, invoiceId });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices`);
  redirect(`/invoices/${invoiceId}`);
}

