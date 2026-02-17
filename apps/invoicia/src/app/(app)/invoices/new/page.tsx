import { prisma } from "@/server/db";
import { requireOrgRole } from "@/server/tenant";
import { InvoiceBuilder } from "./ui";

export default async function NewInvoicePage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true, taxPercent: true, taxLabel: true },
  });
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <InvoiceBuilder
      customers={customers.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        unitPriceCents: p.unitPriceCents,
        unit: p.unit,
        taxPercent: p.taxPercent,
      }))}
      orgDefaults={{
        currency: org.currency,
        taxPercent: org.taxPercent ?? undefined,
        taxLabel: org.taxLabel ?? undefined,
      }}
    />
  );
}

