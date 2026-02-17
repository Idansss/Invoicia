"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { auditEvent } from "@/server/services/audit"
import { voidInvoice } from "@/server/services/invoice-admin"
import { sendReminder } from "@/server/services/reminders"
import { sendInvoice } from "@/server/services/send-invoice"

const idsSchema = z.array(z.string().min(1)).min(1)

export async function sendInvoiceFromListAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  await sendInvoice({ orgId, actorUserId: userId, invoiceId })
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function voidInvoiceFromListAction(invoiceId: string) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  await voidInvoice({ orgId, actorUserId: userId, invoiceId })
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function sendBulkRemindersAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  const invoiceIds = idsSchema.parse(input)

  const rule = await prisma.reminderRule.findFirst({
    where: { enabled: true, policy: { orgId } },
    orderBy: { daysOffset: "asc" },
    select: { id: true },
  })
  if (!rule) {
    throw new Error("No enabled reminder rule found. Configure reminders first.")
  }

  for (const invoiceId of invoiceIds) {
    await sendReminder({ invoiceId, ruleId: rule.id })
  }

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "invoice.reminders.bulk_sent",
    entityType: "Invoice",
    entityId: "bulk",
    data: { invoiceIds },
  })

  revalidatePath("/invoices")
  revalidatePath("/reminders")
}

export async function voidBulkInvoicesAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  const invoiceIds = idsSchema.parse(input)
  for (const invoiceId of invoiceIds) {
    await voidInvoice({ orgId, actorUserId: userId, invoiceId })
  }
  revalidatePath("/invoices")
}

export async function trackBulkExportAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const invoiceIds = idsSchema.parse(input)
  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "invoice.bulk_export.requested",
    entityType: "Invoice",
    entityId: "bulk",
    data: { invoiceIds },
  })
}
