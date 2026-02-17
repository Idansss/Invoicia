import type { CanonicalInvoice, ComplianceContext, CompliancePack, ValidationError } from "@/compliance/core/types";
import { exportUbl21 } from "@/compliance/renderers/ubl21";

function peppolValidate(invoice: CanonicalInvoice): ValidationError[] {
  const errors: ValidationError[] = [];
  // MVP scaffolding: keep Peppol pack permissive, but provide examples.
  if (!invoice.customer.countryCode) {
    errors.push({
      code: "PEPPOL_BUYER_COUNTRY_RECOMMENDED",
      message: "Peppol mode: buyer country code is recommended (CIUS rules may require it).",
      severity: "warning",
      path: "customer.countryCode",
    });
  }
  return errors;
}

export const peppolPack: CompliancePack = {
  key: "PEPPOL",
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void ctx;
    return peppolValidate(invoice);
  },
  exportUbl: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void ctx;
    return exportUbl21(invoice, { mode: "peppol-bis-billing-3" });
  },
};
