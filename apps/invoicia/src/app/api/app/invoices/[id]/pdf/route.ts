import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import { env } from "@/server/env";
import { generateInvoicePdf, persistInvoicePdfArtifact } from "@/server/pdf/generate";
import { upsertExportArtifact } from "@/server/artifacts";
import { readBlob } from "@/server/storage/local";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id },
    include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true, exportArtifacts: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: invoice.orgId } },
    select: { orgId: true },
  });
  if (!membership) return NextResponse.json({ ok: false }, { status: 403 });

  const existing = invoice.exportArtifacts.find((a) => a.kind === "INVOICE_PDF");
  let pdfPath = existing?.storagePath ?? null;
  if (!pdfPath) {
    const hostedUrl = `${env.APP_BASE_URL}/i/${invoice.token}`;
    const { bytes } = await generateInvoicePdf({ invoice, hostedUrl, template: "modern" });
    pdfPath = await persistInvoicePdfArtifact({ orgId: invoice.orgId, invoiceId: invoice.id, template: "modern", bytes });
    await upsertExportArtifact({
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      kind: "INVOICE_PDF",
      storagePath: pdfPath,
      mimeType: "application/pdf",
      byteSize: bytes.byteLength,
    });
  }

  const { bytes } = await readBlob(pdfPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
