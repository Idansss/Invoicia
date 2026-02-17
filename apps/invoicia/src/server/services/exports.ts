import { getPack } from "@/compliance";
import { prisma } from "@/server/db";
import { writeText, upsertExportArtifact } from "@/server/artifacts";
import { toCanonicalInvoice } from "@/server/services/canonicalize";

export async function exportInvoiceUbl(params: {
  orgId: string;
  invoiceId: string;
  profile: "BASE" | "PEPPOL";
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, orgId: params.orgId },
    include: { org: true, customer: true, lineItems: true },
  });
  if (!invoice) throw new Error("Invoice not found.");

  const canonical = toCanonicalInvoice({
    org: invoice.org,
    customer: invoice.customer,
    invoice,
    lineItems: invoice.lineItems,
  });

  const pack = getPack(params.profile);
  const exported = pack.exportUbl(canonical, { profile: params.profile });
  const subdir = `invoices/${invoice.id}`;
  const { storagePath, byteSize } = await writeText(subdir, exported.filename, exported.content);

  const kind =
    params.profile === "PEPPOL" ? ("PEPPOL_UBL_XML" as const) : ("UBL_XML" as const);
  await upsertExportArtifact({
    orgId: params.orgId,
    invoiceId: invoice.id,
    kind,
    storagePath,
    mimeType: exported.mimeType,
    byteSize,
  });

  return { storagePath, xml: exported.content, filename: exported.filename, mimeType: exported.mimeType };
}

