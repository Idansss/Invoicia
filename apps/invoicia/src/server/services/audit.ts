import { prisma } from "@/server/db";
import { emitOutgoingWebhook } from "@/server/webhooks/outgoing";

export async function auditEvent(params: {
  orgId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  data?: unknown;
}) {
  const created = await prisma.auditEvent.create({
    data: {
      orgId: params.orgId,
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (params.data ?? null) as any,
    },
  });

  // Best-effort outgoing events (stubbed).
  const asOutgoing = params.action as unknown as
    | "invoice.sent"
    | "invoice.viewed"
    | "invoice.paid"
    | "invoice.overdue"
    | "dispute.created"
    | "credit_note.issued";
  void emitOutgoingWebhook(asOutgoing, {
    orgId: params.orgId,
    entityType: params.entityType,
    entityId: params.entityId,
    data: params.data ?? null,
  });

  return created;
}
