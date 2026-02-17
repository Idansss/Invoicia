import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";

import { prisma } from "@/server/db";
import { requireUser } from "@/server/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";

export default async function OrgsSwitcherPage() {
  const { userId } = await requireUser();
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { org: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  async function setOrg(formData: FormData) {
    "use server";
    const orgId = String(formData.get("orgId") || "");
    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
      select: { orgId: true },
    });
    if (!membership) throw new Error("Not a member of this organization.");
    const cookieStore = await cookies();
    cookieStore.set("invoicia_org", orgId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    await prisma.user.update({ where: { id: userId }, data: { defaultOrgId: orgId } });
    redirect("/app");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Switch organization"
        description="Choose the active tenant workspace for your current session."
      />

      <Card>
        <CardHeader>
          <CardTitle>Available workspaces</CardTitle>
          <CardDescription>{memberships.length} memberships</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {memberships.map((m) => (
            <form
              key={m.orgId}
              action={setOrg}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {m.org.name}
              </div>
              <input type="hidden" name="orgId" value={m.orgId} />
              <Button type="submit" size="sm" variant="secondary">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Use
              </Button>
            </form>
          ))}
          {memberships.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No organizations yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
