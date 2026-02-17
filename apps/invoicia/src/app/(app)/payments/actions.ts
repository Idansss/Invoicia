"use server"

import { revalidatePath } from "next/cache"

import { auditEvent } from "@/server/services/audit"
import { requireOrgRole } from "@/server/tenant"

export async function connectStripeAction() {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "payments.provider.connect_requested",
    entityType: "Organization",
    entityId: orgId,
    data: { provider: "stripe" },
  })
  revalidatePath("/payments")
  return { nextUrl: "/settings?tab=billing" }
}

export async function openPayoutGuidanceAction() {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "payments.payout.guidance_opened",
    entityType: "Organization",
    entityId: orgId,
  })
  return { nextUrl: "/settings?tab=billing" }
}
