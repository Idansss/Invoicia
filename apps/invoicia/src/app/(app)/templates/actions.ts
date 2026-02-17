"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { auditEvent } from "@/server/services/audit"

const brandingSchema = z.object({
  templateId: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export async function saveTemplateBrandingAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  const data = brandingSchema.parse(input)

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      brandPrimaryColor: data.accentColor,
      brandFont: `template:${data.templateId}`,
    },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "template.branding.saved",
    entityType: "Organization",
    entityId: orgId,
    data,
  })

  revalidatePath("/templates")
}

export async function getTemplatePreviewUrlAction() {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const invoice = await prisma.invoice.findFirst({
    where: { orgId },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "template.preview.requested",
    entityType: "Organization",
    entityId: orgId,
    data: { hasInvoice: Boolean(invoice) },
  })

  if (!invoice) return { previewUrl: "/invoices/new", kind: "setup" as const }

  return { previewUrl: `/api/app/invoices/${invoice.id}/pdf`, kind: "pdf" as const }
}
