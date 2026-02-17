import { validateInvoice } from "@/compliance";
import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { toCanonicalInvoice, sumPaidCents, sumCreditsCents } from "@/server/services/canonicalize";
import { generateInvoicePdf, persistInvoicePdfArtifact } from "@/server/pdf/generate";
import { upsertExportArtifact } from "@/server/artifacts";
import { exportInvoiceUbl } from "@/server/services/exports";
import { sendEmail } from "@/server/email/mailer";
import { InvoiceSentEmail } from "@/server/email/templates/invoice-sent";
import { formatDate, formatMoney } from "@/lib/format";
import { env } from "@/server/env";
import { scheduleInvoiceAutomation } from "@/server/jobs/scheduler";

export async function sendInvoice(params: { orgId: string; actorUserId: string; invoiceId: string }) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, orgId: params.orgId },
    include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "VOID") throw new Error("Cannot send a void invoice.");

  const canonical = toCanonicalInvoice({
    org: invoice.org,
    customer: invoice.customer,
    invoice,
    lineItems: invoice.lineItems,
  });

  const { isValid, errors } = validateInvoice(canonical, invoice.org.complianceProfile);
  await prisma.complianceValidationResult.create({
    data: {
      orgId: params.orgId,
      invoiceId: invoice.id,
      profileKey: invoice.org.complianceProfile,
      isValid,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors: errors as any,
    },
  });
  if (!isValid) {
    const first = errors.find((e) => e.severity === "error");
    throw new Error(first?.message ?? "Invoice failed compliance validation.");
  }

  const hostedUrl = `${env.APP_BASE_URL}/i/${invoice.token}`;

  const { bytes, dueCents } = await generateInvoicePdf({
    invoice,
    hostedUrl,
    template: "modern",
  });
  const pdfPath = await persistInvoicePdfArtifact({
    orgId: invoice.orgId,
    invoiceId: invoice.id,
    template: "modern",
    bytes,
  });
  await upsertExportArtifact({
    orgId: invoice.orgId,
    invoiceId: invoice.id,
    kind: "INVOICE_PDF",
    storagePath: pdfPath,
    mimeType: "application/pdf",
    byteSize: bytes.byteLength,
  });

  // Base UBL export is always available
  await exportInvoiceUbl({ orgId: invoice.orgId, invoiceId: invoice.id, profile: "BASE" });
  if (invoice.org.complianceProfile === "PEPPOL") {
    await exportInvoiceUbl({ orgId: invoice.orgId, invoiceId: invoice.id, profile: "PEPPOL" });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: invoice.status === "DRAFT" ? "SENT" : invoice.status,
      sentAt: invoice.sentAt ?? new Date(),
    },
    include: { payments: true, creditNotes: true },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: params.actorUserId,
    action: "invoice.sent",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { to: invoice.customer.email, hostedUrl },
  });

  const paidCents = sumPaidCents(updated.payments);
  const creditsCents = sumCreditsCents(updated.creditNotes);
  const amountDueFormatted = formatMoney(dueCents, invoice.currency);
  const dueDateFormatted = invoice.dueDate ? formatDate(invoice.dueDate, invoice.org.timezone) : undefined;

  await sendEmail({
    to: invoice.customer.email!,
    subject: `Invoice ${invoice.number} from ${invoice.org.name}`,
    react: InvoiceSentEmail({
      orgName: invoice.org.name,
      invoiceNumber: invoice.number,
      amountDueFormatted,
      dueDateFormatted,
      hostedUrl,
    }),
    attachments: [{ filename: `${invoice.number}.pdf`, content: bytes, contentType: "application/pdf" }],
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: params.actorUserId,
    action: "invoice.email_sent",
    entityType: "Invoice",
    entityId: invoice.id,
    data: { to: invoice.customer.email },
  });

  try {
    await scheduleInvoiceAutomation(invoice.id);
  } catch {
    // Worker/Redis might not be running in some environments; sending should still succeed.
  }

  return { invoiceId: invoice.id, hostedUrl, paidCents, creditsCents };
}
