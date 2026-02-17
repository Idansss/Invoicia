import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { saveBlob } from "@/server/storage/local";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, orgId: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: invoice.orgId } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ ok: false }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const stored = await saveBlob({
    dir: `invoice-attachments/${invoice.id}`,
    filename: file.name,
    bytes,
    contentType: file.type || undefined,
  });

  const attachment = await prisma.invoiceAttachment.create({
    data: {
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath: stored.storagePath,
    },
  });

  return NextResponse.json({ ok: true, attachmentId: attachment.id });
}
