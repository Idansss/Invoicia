import type { CanonicalInvoice, ComplianceContext, CompliancePack } from "@/compliance/core/types";

export const aePack: CompliancePack = {
  key: "BASE",
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void invoice;
    void ctx;
    // TODO (UAE): structured data requirements and reporting/clearance scaffolding.
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
