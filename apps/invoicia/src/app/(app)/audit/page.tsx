import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDateTime } from "@/lib/format"
import { AuditClient, type AuditEventRow } from "./client"
import type { AuditEvent } from "@prisma/client"

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}

function getEventDataName(data: AuditEvent["data"]) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const maybeName = data.name
  return typeof maybeName === "string" ? maybeName : null
}

export default async function AuditLogPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { timezone: true },
  })
  const events: AuditEvent[] = await prisma.auditEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const actorIds = Array.from(new Set(events.map((event) => event.actorUserId).filter(isString)))
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : []
  const actorById = new Map(actors.map((actor) => [actor.id, actor]))

  const rows: AuditEventRow[] = events.map((event) => {
    const actor = event.actorUserId ? actorById.get(event.actorUserId) : null
    const actorName = actor?.name || actor?.email || "System"
    const dataName = getEventDataName(event.data)
    return {
      id: event.id,
      event: event.action,
      actor: actorName,
      entity: event.entityType,
      entityId: event.entityId,
      timestamp: formatDateTime(event.createdAt, org.timezone),
      details: dataName ? `${event.action} - ${dataName}` : event.action,
    }
  })

  return <AuditClient events={rows} />
}
