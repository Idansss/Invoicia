import fs from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

export const runtime = "nodejs"

import { auth } from "@/server/auth"
import { prisma } from "@/server/db"
import { auditEvent } from "@/server/services/audit"
import { saveBlob } from "@/server/storage/local"
import { getActiveOrgId } from "@/server/tenant"

function contentTypeFromFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase()
  if (extension === ".png") return "image/png"
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg"
  if (extension === ".webp") return "image/webp"
  if (extension === ".gif") return "image/gif"
  if (extension === ".svg") return "image/svg+xml"
  return "application/octet-stream"
}

async function getRequestContext() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false as const, response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) }

  const orgId = await getActiveOrgId(userId)
  if (!orgId) return { ok: false as const, response: NextResponse.json({ ok: false, error: "No active organization" }, { status: 404 }) }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  })
  if (!membership) return { ok: false as const, response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) }

  return { ok: true as const, orgId, userId, role: membership.role }
}

export async function GET() {
  const context = await getRequestContext()
  if (!context.ok) return context.response

  const org = await prisma.organization.findUnique({
    where: { id: context.orgId },
    select: { logoPath: true },
  })
  if (!org?.logoPath) {
    return NextResponse.json({ ok: false, error: "Logo not found" }, { status: 404 })
  }

  try {
    const bytes = await fs.readFile(org.logoPath)
    const filename = path.basename(org.logoPath)
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentTypeFromFilename(filename),
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Logo file missing" }, { status: 404 })
  }
}

export async function POST(request: Request) {
  const context = await getRequestContext()
  if (!context.ok) return context.response
  if (context.role === "READONLY") {
    return NextResponse.json({ ok: false, error: "Insufficient permissions" }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Only image files are allowed" }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Logo must be under 10MB" }, { status: 400 })
  }

  const previous = await prisma.organization.findUnique({
    where: { id: context.orgId },
    select: { logoPath: true },
  })

  const bytes = new Uint8Array(await file.arrayBuffer())
  const stored = await saveBlob({
    dir: `org-logos/${context.orgId}`,
    filename: file.name,
    bytes,
  })

  await prisma.organization.update({
    where: { id: context.orgId },
    data: { logoPath: stored.storagePath },
  })

  if (previous?.logoPath) {
    void fs.unlink(previous.logoPath).catch(() => undefined)
  }

  await auditEvent({
    orgId: context.orgId,
    actorUserId: context.userId,
    action: "settings.logo.uploaded",
    entityType: "Organization",
    entityId: context.orgId,
    data: { filename: file.name, sizeBytes: file.size },
  })

  return NextResponse.json({
    ok: true,
    logoUrl: `/api/app/settings/logo?ts=${Date.now()}`,
    fileName: file.name,
  })
}

export async function DELETE() {
  const context = await getRequestContext()
  if (!context.ok) return context.response
  if (context.role === "READONLY") {
    return NextResponse.json({ ok: false, error: "Insufficient permissions" }, { status: 403 })
  }

  const current = await prisma.organization.findUnique({
    where: { id: context.orgId },
    select: { logoPath: true },
  })

  await prisma.organization.update({
    where: { id: context.orgId },
    data: { logoPath: null },
  })

  if (current?.logoPath) {
    void fs.unlink(current.logoPath).catch(() => undefined)
  }

  await auditEvent({
    orgId: context.orgId,
    actorUserId: context.userId,
    action: "settings.logo.removed",
    entityType: "Organization",
    entityId: context.orgId,
  })

  return NextResponse.json({ ok: true })
}
