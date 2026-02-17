import { prisma } from "@/server/db"
import { requireOrgRole } from "@/server/tenant"
import SettingsClient from "./client"

function initialsFromName(name: string, email: string) {
  if (name) return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const query = await searchParams
  const { orgId, role, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const [org, memberships, user] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        legalName: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        countryCode: true,
        timezone: true,
        currency: true,
        invoicePrefix: true,
        taxLabel: true,
        taxPercent: true,
        taxId: true,
        logoPath: true,
        brandPrimaryColor: true,
        updatedAt: true,
      },
    }),
    prisma.membership.findMany({
      where: { orgId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    }),
  ])

  const teamMembers = memberships.map((member) => ({
    id: member.id,
    name: member.user.name ?? "Team Member",
    email: member.user.email ?? "",
    role: member.role,
    initials: initialsFromName(member.user.name ?? "", member.user.email ?? ""),
    joinedAt: member.createdAt.toISOString(),
  }))

  const defaultTab = query.tab && ["organization", "team", "security", "billing"].includes(query.tab)
    ? query.tab
    : "organization"

  return (
    <SettingsClient
      org={org}
      teamMembers={teamMembers}
      twoFactorEnabled={Boolean(user.twoFactorEnabled)}
      defaultTab={defaultTab}
      currentRole={role}
      initialLogoUrl={org.logoPath ? `/api/app/settings/logo?ts=${org.updatedAt.getTime()}` : ""}
    />
  )
}
