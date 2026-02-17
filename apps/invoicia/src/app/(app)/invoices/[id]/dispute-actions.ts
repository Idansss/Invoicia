"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/server/db";
import { requireOrgRole } from "@/server/tenant";
import { auditEvent } from "@/server/services/audit";
import { issueCreditNote } from "@/server/services/invoice-admin";

const rejectSchema = z.object({
  disputeId: z.string().min(1),
  message: z.string().min(1).max(1000),
});

export async function rejectDisputeAction(invoiceId: string, input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const data = rejectSchema.parse(input);

  const dispute = await prisma.dispute.findFirst({
    where: { id: data.disputeId, orgId, invoiceId },
    select: { id: true },
  });
  if (!dispute) throw new Error("Dispute not found.");

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: { status: "REJECTED", sellerResponse: data.message },
  });

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "dispute.rejected",
    entityType: "Dispute",
    entityId: dispute.id,
    data: { invoiceId, message: data.message },
  });

  revalidatePath(`/invoices/${invoiceId}`);
}

const approveCreditSchema = z.object({
  disputeId: z.string().min(1),
  amountCents: z.coerce.number().int().min(1),
  reason: z.string().optional(),
});

export async function approveDisputeWithCreditNoteAction(
  invoiceId: string,
  input: unknown,
) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"]);
  const data = approveCreditSchema.parse(input);

  const dispute = await prisma.dispute.findFirst({
    where: { id: data.disputeId, orgId, invoiceId },
    select: { id: true },
  });
  if (!dispute) throw new Error("Dispute not found.");

  await issueCreditNote({
    orgId,
    actorUserId: userId,
    invoiceId,
    amountCents: data.amountCents,
    reason: data.reason || "Dispute resolution",
  });

  await prisma.dispute.update({
    where: { id: dispute.id },
    data: { status: "APPROVED", sellerResponse: "Approved - credit note issued." },
  });

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "dispute.approved",
    entityType: "Dispute",
    entityId: dispute.id,
    data: { invoiceId, resolution: "credit_note" },
  });

  revalidatePath(`/invoices/${invoiceId}`);
}

