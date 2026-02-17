"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { auditEvent } from "@/server/services/audit"

const toggleSchema = z.object({
  ruleId: z.string().min(1),
  enabled: z.coerce.boolean(),
})

export async function toggleReminderRuleAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])
  const data = toggleSchema.parse(input)

  const rule = await prisma.reminderRule.findFirst({
    where: { id: data.ruleId, policy: { orgId } },
    select: { id: true, policyId: true },
  })
  if (!rule) throw new Error("Reminder rule not found.")

  await prisma.reminderRule.update({
    where: { id: rule.id },
    data: { enabled: data.enabled },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "reminder.rule.updated",
    entityType: "ReminderRule",
    entityId: rule.id,
    data: { enabled: data.enabled },
  })

  revalidatePath("/reminders")
}

export async function createDefaultReminderPolicyAction() {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"])

  const existing = await prisma.reminderPolicy.findFirst({
    where: { orgId },
    select: { id: true },
  })
  if (existing) {
    throw new Error("Reminder policy already exists.")
  }

  const policy = await prisma.reminderPolicy.create({
    data: {
      orgId,
      name: "Default",
      enabled: true,
      rules: {
        create: [
          { daysOffset: -3, templateKey: "friendly", enabled: true },
          { daysOffset: 0, templateKey: "friendly", enabled: true },
          { daysOffset: 7, templateKey: "firm", enabled: true },
        ],
      },
    },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "reminder.policy.created",
    entityType: "ReminderPolicy",
    entityId: policy.id,
  })

  revalidatePath("/reminders")
}
