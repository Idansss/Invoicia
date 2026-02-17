import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { exportInvoiceUbl } from "@/server/services/exports";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "peppol" ? "PEPPOL" : "BASE";

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: invoice.orgId } },
    select: { orgId: true },
  });
  if (!membership) return NextResponse.json({ ok: false }, { status: 403 });

  const exported = await exportInvoiceUbl({
    orgId: invoice.orgId,
    invoiceId: id,
    profile: mode,
  });

  return new NextResponse(exported.xml, {
    headers: {
      "Content-Type": exported.mimeType,
      "Content-Disposition": `attachment; filename="${exported.filename}"`,
    },
  });
}
