import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";
import { saveBlob } from "@/server/storage/local";
import { sendEmail } from "@/server/email/mailer";
import { DisputeCreatedEmail } from "@/server/email/templates/dispute-created";
import { rateLimit } from "@/server/rate-limit";

const disputeSchema = z.object({
  reasonCode: z.enum([
    "WRONG_QUANTITY",
    "WRONG_TAX",
    "WRONG_PRICE",
    "WRONG_PO",
    "DUPLICATE_INVOICE",
    "OTHER",
  ]),
  message: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { token } = await params;
  const rl = await rateLimit({
    key: `public:dispute:${ip}:${token}`,
    limit: 10,
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
    select: { id: true, orgId: true, customerId: true, number: true, org: { select: { name: true } } },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });

  const form = await req.formData();
  const parsed = disputeSchema.parse({
    reasonCode: form.get("reasonCode"),
    message: form.get("message") || undefined,
  });

  let attachmentPath: string | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await saveBlob({
      dir: `disputes/${invoice.id}`,
      filename: file.name,
      bytes,
    });
    attachmentPath = stored.storagePath;
  }

  const dispute = await prisma.dispute.create({
    data: {
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      reasonCode: parsed.reasonCode,
      message: parsed.message || null,
      attachmentPath,
    },
  });

  await auditEvent({
    orgId: invoice.orgId,
    actorUserId: null,
    action: "dispute.created",
    entityType: "Dispute",
    entityId: dispute.id,
    data: { invoiceId: invoice.id, reasonCode: dispute.reasonCode },
  });

  const orgAdmins = await prisma.membership.findMany({
    where: { orgId: invoice.orgId, role: { in: ["OWNER", "ADMIN"] } },
    include: { user: { select: { email: true } } },
  });
  const recipients = Array.from(new Set(orgAdmins.map((m) => m.user.email).filter(Boolean)));
  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `New change request: ${invoice.number}`,
      react: DisputeCreatedEmail({
        orgName: invoice.org.name,
        invoiceNumber: invoice.number,
        reasonCode: dispute.reasonCode,
        message: dispute.message || undefined,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
