import fs from "node:fs/promises";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { env } from "@/server/env";
import { generateInvoicePdf, persistInvoicePdfArtifact } from "@/server/pdf/generate";
import { upsertExportArtifact } from "@/server/artifacts";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { token } = await params;

  const rl = await rateLimit({ key: `public:pdf:${ip}:${token}`, limit: 30, windowSeconds: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: { token },
    include: { org: true, customer: true, lineItems: true, payments: true, creditNotes: true, exportArtifacts: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });

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

  const bytes = await fs.readFile(pdfPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
