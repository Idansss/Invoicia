import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { sendEmail } from "@/server/email/mailer";
import { ReminderEmail } from "@/server/email/templates/reminder";
import { computeAmountDueCents } from "@/server/services/invoice-finance";
import { formatDate, formatMoney } from "@/lib/format";
import { auditEvent } from "@/server/services/audit";

export async function sendReminder(params: { invoiceId: string; ruleId: string }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      org: true,
      customer: true,
      lineItems: true,
      payments: true,
      creditNotes: true,
    },
  });
  if (!invoice) return;

  const rule = await prisma.reminderRule.findUnique({ where: { id: params.ruleId } });
  const hostedUrl = `${env.APP_BASE_URL}/i/${invoice.token}`;

  if (!rule?.enabled) {
    await prisma.reminderJobLog.create({
      data: { orgId: invoice.orgId, invoiceId: invoice.id, ruleId: params.ruleId, status: "SKIPPED" },
    });
    return;
  }

  if (!invoice.customer.email) {
    await prisma.reminderJobLog.create({
      data: { orgId: invoice.orgId, invoiceId: invoice.id, ruleId: rule.id, status: "FAILED", error: "Missing customer email" },
    });
    return;
  }

  const { dueCents } = computeAmountDueCents({
    invoice,
    lineItems: invoice.lineItems,
    payments: invoice.payments,
    creditNotes: invoice.creditNotes,
  });

  if (dueCents <= 0 || invoice.status === "PAID" || invoice.status === "VOID" || invoice.status === "DRAFT") {
    await prisma.reminderJobLog.create({
      data: { orgId: invoice.orgId, invoiceId: invoice.id, ruleId: rule.id, status: "SKIPPED" },
    });
    return;
  }

  if (invoice.dueDate && invoice.dueDate.getTime() < Date.now() && (invoice.status === "SENT" || invoice.status === "VIEWED")) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE" } });
  }

  const amountDueFormatted = formatMoney(dueCents, invoice.currency);
  const dueDateFormatted = invoice.dueDate ? formatDate(invoice.dueDate, invoice.org.timezone) : undefined;
  const tone: "friendly" | "firm" =
    rule.templateKey === "firm" ? "firm" : "friendly";

  await sendEmail({
    to: invoice.customer.email,
    subject: `${tone === "firm" ? "Payment reminder" : "Friendly reminder"}: ${invoice.number}`,
    react: ReminderEmail({
      orgName: invoice.org.name,
      invoiceNumber: invoice.number,
      amountDueFormatted,
      dueDateFormatted,
      hostedUrl,
      tone,
    }),
  });

  await prisma.reminderJobLog.create({
    data: { orgId: invoice.orgId, invoiceId: invoice.id, ruleId: rule.id, status: "SENT" },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: null,
    action: "invoice.reminder_sent",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { ruleId: rule.id, tone },
  });
}
