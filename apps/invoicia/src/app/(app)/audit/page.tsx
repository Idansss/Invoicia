import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatDateTime } from "@/lib/format"
import { AuditClient, type AuditEventRow } from "./client"

export default async function AuditLogPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { timezone: true },
  })
  const events = await prisma.auditEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const actorIds = Array.from(new Set(events.map((event) => event.actorUserId).filter(Boolean))) as string[]
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
    const dataName =
      event.data && typeof event.data === "object" && "name" in event.data
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          String((event.data as any).name)
        : null
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
