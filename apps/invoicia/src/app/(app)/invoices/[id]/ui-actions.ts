"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireOrgRole } from "@/server/tenant"
import { sendInvoice } from "@/server/services/send-invoice"
import { duplicateInvoice, issueCreditNote, recordManualPayment, voidInvoice } from "@/server/services/invoice-admin"

export async function sendInvoiceUiAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  await sendInvoice({ orgId, actorUserId: userId, invoiceId })
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath(`/invoices`)
}

const creditSchema = z.object({
  amountCents: z.coerce.number().int().min(1),
  reason: z.string().max(200).optional(),
})

export async function createCreditNoteUiAction(invoiceId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"])
  const data = creditSchema.parse(input)
  await issueCreditNote({ orgId, actorUserId: userId, invoiceId, amountCents: data.amountCents, reason: data.reason })
  revalidatePath(`/invoices/${invoiceId}`)
}

const paymentSchema = z.object({
  amountCents: z.coerce.number().int().min(1),
})

export async function recordManualPaymentUiAction(invoiceId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"])
  const data = paymentSchema.parse(input)
  await recordManualPayment({ orgId, actorUserId: userId, invoiceId, amountCents: data.amountCents })
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function voidInvoiceUiAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  await voidInvoice({ orgId, actorUserId: userId, invoiceId })
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function duplicateInvoiceUiAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  const invoice = await duplicateInvoice({ orgId, actorUserId: userId, invoiceId })
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoice.id}`)
  return invoice
}
