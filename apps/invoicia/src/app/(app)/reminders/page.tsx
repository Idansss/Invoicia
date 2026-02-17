import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDate } from "@/lib/format"
import { RemindersClient, type ReminderRuleRow, type ReminderLogRow } from "./client"

function formatTiming(daysOffset: number) {
  if (daysOffset < 0) return `${Math.abs(daysOffset)} days before due`
  if (daysOffset === 0) return "On due date"
  return `${daysOffset} days after due`
}

function toneFromTemplate(templateKey: string): ReminderRuleRow["tone"] {
  if (templateKey === "final") return "final"
  if (templateKey === "firm") return "firm"
  return "friendly"
}

export default async function RemindersPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])

  const policy = await prisma.reminderPolicy.findFirst({
    where: { orgId },
    include: { rules: { orderBy: { daysOffset: "asc" } } },
  })

  const logs = await prisma.reminderJobLog.findMany({
    where: { orgId },
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const rules: ReminderRuleRow[] = (policy?.rules ?? []).map((rule) => {
    const tone = toneFromTemplate(rule.templateKey)
    return {
      id: rule.id,
      timing: formatTiming(rule.daysOffset),
      dayOffset: rule.daysOffset,
      tone,
      enabled: rule.enabled,
      subject: `${tone.charAt(0).toUpperCase() + tone.slice(1)} reminder: Invoice {{number}}`,
      body: "Hi {{name}}, just a reminder that invoice {{number}} for {{amount}} is due on {{dueDate}}.",
    }
  })

  const rulesById = new Map((policy?.rules ?? []).map((rule) => [rule.id, rule]))

  const logRows: ReminderLogRow[] = logs.map((log) => {
    const status = log.status === "SENT" ? "sent" : log.status === "FAILED" ? "failed" : "opened"
    const rule = log.ruleId ? rulesById.get(log.ruleId) : null
    return {
      id: log.id,
      reminder: rule ? formatTiming(rule.daysOffset) : "Reminder",
      customer: log.invoice.customer.name,
      invoice: log.invoice.number,
      status,
      date: formatDate(log.createdAt),
    }
  })

  return <RemindersClient rules={rules} logs={logRows} />
}
