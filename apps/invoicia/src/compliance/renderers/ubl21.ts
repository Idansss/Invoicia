import { create } from "xmlbuilder2";

import type { CanonicalInvoice } from "@/compliance/core/types";

export function exportUbl21(
  invoice: CanonicalInvoice,
  opts: { mode: "base" | "peppol-bis-billing-3" },
) {
  // Minimal UBL 2.1 invoice for interoperability tests.
  // TODO (Phase 2): tax subtotals, party IDs, payment means, allowances/charges, CIUS rules, and schema validation.
  const issueDate = invoice.invoice.issueDate.toISOString().slice(0, 10);
  const dueDate = invoice.invoice.dueDate ? invoice.invoice.dueDate.toISOString().slice(0, 10) : undefined;

  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("Invoice", {
      xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    })
    .ele("cbc:UBLVersionID")
    .txt("2.1")
    .up()
    .ele("cbc:CustomizationID")
    .txt(opts.mode === "peppol-bis-billing-3" ? "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0" : "urn:invoicia:base")
    .up()
    .ele("cbc:ProfileID")
    .txt(opts.mode === "peppol-bis-billing-3" ? "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0" : "urn:invoicia:base:1.0")
    .up()
    .ele("cbc:ID")
    .txt(invoice.invoice.number)
    .up()
    .ele("cbc:IssueDate")
    .txt(issueDate)
    .up();

  if (dueDate) root.ele("cbc:DueDate").txt(dueDate).up();

  // Supplier
  root
    .ele("cac:AccountingSupplierParty")
    .ele("cac:Party")
    .ele("cac:PartyName")
    .ele("cbc:Name")
    .txt(invoice.org.name)
    .up()
    .up()
    .up()
    .up();

  // Customer
  root
    .ele("cac:AccountingCustomerParty")
    .ele("cac:Party")
    .ele("cac:PartyName")
    .ele("cbc:Name")
    .txt(invoice.customer.name)
    .up()
    .up()
    .up()
    .up();

  // Lines (amounts are placeholders in this MVP exporter)
  invoice.lineItems.forEach((li, idx) => {
    const qty = Number.parseFloat(li.quantity || "0") || 0;
    const lineAmount = (qty * li.unitPriceCents) / 100;
    root
      .ele("cac:InvoiceLine")
      .ele("cbc:ID")
      .txt(String(idx + 1))
      .up()
      .ele("cbc:InvoicedQuantity")
      .txt(li.quantity)
      .up()
      .ele("cbc:LineExtensionAmount", { currencyID: invoice.invoice.currency })
      .txt(lineAmount.toFixed(2))
      .up()
      .ele("cac:Item")
      .ele("cbc:Name")
      .txt(li.description)
      .up()
      .up()
      .ele("cac:Price")
      .ele("cbc:PriceAmount", { currencyID: invoice.invoice.currency })
      .txt((li.unitPriceCents / 100).toFixed(2))
      .up()
      .up()
      .up();
  });

  const xml = root.end({ prettyPrint: true });
  return {
    mimeType: "application/xml",
    filename:
      opts.mode === "peppol-bis-billing-3"
        ? `${invoice.invoice.number}-peppol.xml`
        : `${invoice.invoice.number}.xml`,
    content: xml,
  };
}
