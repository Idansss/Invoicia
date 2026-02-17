import type { CompliancePack, ComplianceProfileKey, CanonicalInvoice, ValidationError } from "@/compliance/core/types";
import { basePack } from "@/compliance/packs/base";
import { peppolPack } from "@/compliance/packs/peppol";

export function getPack(profile: ComplianceProfileKey): CompliancePack {
  if (profile === "PEPPOL") return peppolPack;
  return basePack;
}

export function validateInvoice(invoice: CanonicalInvoice, profile: ComplianceProfileKey) {
  const pack = getPack(profile);
  const baseErrors = basePack.validate(invoice, { profile });
  const packErrors = pack.key === "BASE" ? [] : pack.validate(invoice, { profile });
  const all = [...baseErrors, ...packErrors];
  const isValid = all.filter((e) => e.severity === "error").length === 0;
  return { isValid, errors: all satisfies ValidationError[] };
}

