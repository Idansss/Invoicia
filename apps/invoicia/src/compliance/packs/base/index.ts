import type { CanonicalInvoice, ComplianceContext, CompliancePack, ValidationError } from "@/compliance/core/types";
import { exportUbl21 } from "@/compliance/renderers/ubl21";

function baseValidate(invoice: CanonicalInvoice): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!invoice.org.name) errors.push({ code: "ORG_NAME_REQUIRED", message: "Organization name is required.", severity: "error", path: "org.name" });
  if (!invoice.customer.name) errors.push({ code: "CUSTOMER_NAME_REQUIRED", message: "Customer name is required.", severity: "error", path: "customer.name" });
  if (!invoice.customer.email) errors.push({ code: "CUSTOMER_EMAIL_REQUIRED", message: "Customer email is required to send invoices.", severity: "error", path: "customer.email" });
  if (!invoice.invoice.number) errors.push({ code: "INVOICE_NUMBER_REQUIRED", message: "Invoice number is required.", severity: "error", path: "invoice.number" });
  if (!invoice.lineItems.length) errors.push({ code: "LINE_ITEMS_REQUIRED", message: "At least one line item is required.", severity: "error", path: "lineItems" });
  for (const [idx, li] of invoice.lineItems.entries()) {
    if (!li.description) errors.push({ code: "LINE_DESC_REQUIRED", message: `Line ${idx + 1}: description is required.`, severity: "error", path: `lineItems.${idx}.description` });
  }
  return errors;
}

export const basePack: CompliancePack = {
  key: "BASE",
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void ctx;
    return baseValidate(invoice);
  },
  exportUbl: (invoice: CanonicalInvoice, ctx: ComplianceContext) => {
    void ctx;
    return exportUbl21(invoice, { mode: "base" });
  },
};
