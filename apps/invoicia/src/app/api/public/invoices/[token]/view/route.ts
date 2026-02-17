import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { rateLimit } from "@/server/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { token } = await params;
  const rl = await rateLimit({
    key: `public:view:${ip}:${token}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }
  const invoice = await prisma.invoice.findFirst({
    where: { token },
    select: { id: true, orgId: true, status: true, viewedAt: true },
  });
  if (!invoice) return NextResponse.json({ ok: true });

  if (!invoice.viewedAt && (invoice.status === "SENT" || invoice.status === "VIEWED")) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "VIEWED", viewedAt: new Date() },
    });
    await auditEvent({
      orgId: invoice.orgId,
      action: "invoice.viewed",
      entityType: "Invoice",
      entityId: invoice.id,
      actorUserId: null,
      data: { source: "hosted_page" },
    });
  }

  return NextResponse.json({ ok: true });
}
