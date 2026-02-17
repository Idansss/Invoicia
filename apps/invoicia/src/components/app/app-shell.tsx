import { prisma } from "@/server/db";
import { getActiveOrgId, requireUser } from "@/server/tenant";
import { AppShellClient } from "@/components/app/app-shell-client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { userId } = await requireUser();
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.membership.findMany({
      where: { userId },
      include: { org: { select: { id: true, name: true, logoPath: true, updatedAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const activeOrgId = await getActiveOrgId(userId);
  const activeOrg = memberships.find((m) => m.orgId === activeOrgId)?.org ?? null;

  return (
    <AppShellClient
      orgName={activeOrg?.name ?? "Workspace"}
      orgs={memberships.map((m) => ({ id: m.orgId, name: m.org.name }))}
      activeOrgId={activeOrgId}
      orgLogoUrl={activeOrg?.logoPath ? `/api/app/settings/logo?v=${activeOrg.updatedAt.getTime()}` : null}
      user={{ name: user?.name ?? null, email: user?.email ?? null }}
    >
      {children}
    </AppShellClient>
  );
}
