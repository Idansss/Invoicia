import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/server/db";
import { env } from "@/server/env";

export async function writeBytes(subdir: string, filename: string, bytes: Buffer) {
  const fullDir = path.join(env.STORAGE_DIR, subdir);
  await fs.mkdir(fullDir, { recursive: true });
  const storagePath = path.join(fullDir, filename);
  await fs.writeFile(storagePath, bytes);
  return { storagePath, byteSize: bytes.byteLength };
}

export async function writeText(subdir: string, filename: string, content: string) {
  const bytes = Buffer.from(content, "utf8");
  return writeBytes(subdir, filename, bytes);
}

export async function upsertExportArtifact(params: {
  orgId: string;
  kind: "INVOICE_PDF" | "RECEIPT_PDF" | "UBL_XML" | "PEPPOL_UBL_XML";
  storagePath: string;
  mimeType: string;
  byteSize?: number;
  invoiceId?: string;
  receiptId?: string;
}) {
  return prisma.exportArtifact.create({
    data: {
      orgId: params.orgId,
      kind: params.kind,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      byteSize: params.byteSize ?? null,
      invoiceId: params.invoiceId ?? null,
      receiptId: params.receiptId ?? null,
    },
  });
}

