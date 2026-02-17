import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import { formatMoney } from "@/lib/format"
import { ProductsClient, type ProductRow } from "./client"

export default async function ProductsPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currency: true },
  })

  const products = await prisma.product.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  })

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    unit: product.unit,
    unitPrice: formatMoney(product.unitPriceCents, org.currency),
    taxPercent: product.taxPercent,
  }))

  return <ProductsClient products={rows} />
}
