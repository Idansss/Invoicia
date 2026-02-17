import type { CanonicalInvoice, ComplianceContext, CompliancePack } from "@/compliance/core/types";

export const ngPack: CompliancePack = {
  key: "BASE",
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void invoice;
    void ctx;
    // TODO (Nigeria): implement FIRS/NITDA-specific required fields and clearance adapter hooks.
    return [];
  },
  exportUbl: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void invoice;
    // TODO (Nigeria): add QR payload requirements and invoice ID constraints.
    return ctx.profile === "PEPPOL"
      ? { mimeType: "application/xml", filename: `${invoice.invoice.number}-peppol.xml`, content: "" }
      : { mimeType: "application/xml", filename: `${invoice.invoice.number}.xml`, content: "" };
  },
};
