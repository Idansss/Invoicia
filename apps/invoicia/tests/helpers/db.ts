import { prisma } from "@/server/db";

export async function resetDb() {
  await prisma.exportArtifact.deleteMany();
  await prisma.complianceValidationResult.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.reminderJobLog.deleteMany();
  await prisma.invoiceLateFeeApplication.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.invoiceAttachment.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reminderRule.deleteMany();
  await prisma.reminderPolicy.deleteMany();
  await prisma.lateFeePolicy.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

