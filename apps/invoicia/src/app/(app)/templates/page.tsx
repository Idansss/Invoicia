import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import TemplatesClient from "./client"

export default async function TemplatesPage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      brandPrimaryColor: true,
      brandFont: true,
      logoPath: true,
      name: true,
      legalName: true,
      addressLine1: true,
      city: true,
      state: true,
      email: true,
      updatedAt: true,
    },
  })

  const activeTemplate = org.brandFont?.startsWith("template:") ? org.brandFont.replace("template:", "") : "1"

  return (
    <TemplatesClient
      initialTemplateId={activeTemplate}
      initialAccentColor={org.brandPrimaryColor || "#6366f1"}
      initialLogoPath={org.logoPath || ""}
      initialLogoUrl={org.logoPath ? `/api/app/settings/logo?v=${org.updatedAt.getTime()}` : ""}
      companyPreview={{
        name: org.legalName || org.name,
        addressLine1: org.addressLine1 || "",
        city: org.city || "",
        state: org.state || "",
        email: org.email || "",
      }}
    />
  )
}
