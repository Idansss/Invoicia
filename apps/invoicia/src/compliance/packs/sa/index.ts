import type { CanonicalInvoice, ComplianceContext, CompliancePack } from "@/compliance/core/types";

export const saPack: CompliancePack = {
  key: "BASE",
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void invoice;
    void ctx;
    // TODO (Saudi ZATCA): Phase 1/2 rules, QR requirements, and clearance adapter interfaces (no real clearance here).
    return [];
  },
  exportUbl: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void ctx;
    return {
      mimeType: "application/xml",
      filename: `${invoice.invoice.number}.xml`,
      content: "",
    };
  },
};
