import { DateTime } from "luxon";

import { prisma } from "@/server/db";
import { getLateFeesQueue, getRemindersQueue } from "@/server/jobs/queues";

export async function scheduleInvoiceAutomation(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      org: {
        include: {
          reminderPolicies: { include: { rules: true } },
          lateFeePolicies: true,
        },
      },
    },
  });
  if (!invoice?.dueDate) return;

  const tz = invoice.org.timezone || "UTC";
  const dueLocal9 = DateTime.fromJSDate(invoice.dueDate, { zone: "utc" })
    .setZone(tz)
    .startOf("day")
    .plus({ hours: 9 });

  const policy = invoice.org.reminderPolicies.find((p) => p.enabled) ?? invoice.org.reminderPolicies[0];
  if (policy?.enabled) {
    const rules = policy.rules.filter((r) => r.enabled).slice(0, 5);
    for (const rule of rules) {
      const runAt = dueLocal9.plus({ days: rule.daysOffset }).toUTC();
      const delayMs = Math.max(0, runAt.toMillis() - Date.now());
      await getRemindersQueue().add(
        "send-reminder",
        { invoiceId: invoice.id, ruleId: rule.id },
        { delay: delayMs, removeOnComplete: true, attempts: 3 },
      );
    }
  }

  const lateFee = invoice.org.lateFeePolicies.find((p) => p.enabled) ?? null;
  if (lateFee?.enabled) {
    const runAt = dueLocal9.plus({ days: lateFee.daysAfterDue }).toUTC();
    const delayMs = Math.max(0, runAt.toMillis() - Date.now());
    await getLateFeesQueue().add(
      "apply-late-fee",
      { invoiceId: invoice.id, policyId: lateFee.id },
      { delay: delayMs, removeOnComplete: true, attempts: 3 },
    );
  }
}
