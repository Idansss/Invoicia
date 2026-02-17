import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import ComplianceClient from "./client"

export default async function CompliancePage() {
  const { orgId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { complianceProfile: true },
  })

  return <ComplianceClient activeProfile={org.complianceProfile} />
}
