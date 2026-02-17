import fs from "node:fs/promises";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const { token } = await params;

  const rl = await rateLimit({
    key: `public:receipt:${ip}:${token}`,
    limit: 30,
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
    include: { receipts: true },
  });
  if (!invoice) return NextResponse.json({ ok: false }, { status: 404 });

  const receipt = invoice.receipts[0];
  if (!receipt?.pdfPath) {
    return NextResponse.json({ ok: false, error: "Receipt not available." }, { status: 404 });
  }

  const bytes = await fs.readFile(receipt.pdfPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
