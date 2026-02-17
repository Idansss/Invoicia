export type ValidationError = {
  code: string;
  message: string;
  path?: string;
  severity: "error" | "warning";
};

export type ComplianceProfileKey = "BASE" | "PEPPOL";

export type ComplianceContext = {
  profile: ComplianceProfileKey;
};

export type CanonicalInvoice = {
  org: {
    name: string;
    countryCode?: string | null;
    taxId?: string | null;
    currency: string;
  };
  customer: {
    name: string;
    email?: string | null;
    countryCode?: string | null;
    taxId?: string | null;
  };
  invoice: {
    id: string;
    number: string;
    issueDate: Date;
    dueDate?: Date | null;
    currency: string;
    notes?: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: string;
    unitPriceCents: number;
    taxPercent: number;
  }>;
};

export type ExportResult = {
  mimeType: string;
  filename: string;
  content: string;
};

export type CompliancePack = {
  key: ComplianceProfileKey;
  validate: (invoice: CanonicalInvoice, ctx: ComplianceContext) => ValidationError[];
  exportUbl: (invoice: CanonicalInvoice, ctx: ComplianceContext) => ExportResult;
};

