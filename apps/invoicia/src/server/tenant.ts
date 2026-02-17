import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { auth } from "@/server/auth";
import type { MembershipRole } from "@prisma/client";

const ORG_COOKIE = "invoicia_org";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in");
  return { userId };
}

export async function getActiveOrgId(userId: string) {
  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ORG_COOKIE)?.value;
  if (cookieOrg) return cookieOrg;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultOrgId: true },
  });
  if (user?.defaultOrgId) return user.defaultOrgId;

  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { orgId: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.orgId ?? null;
}

export async function requireOrgRole(minRole: MembershipRole[] = ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"]) {
  const { userId } = await requireUser();
  const orgId = await getActiveOrgId(userId);
  if (!orgId) redirect("/app/onboarding");

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true, orgId: true },
  });
  if (!membership) redirect("/app/onboarding");

  if (!minRole.includes(membership.role)) redirect("/app");

  return { userId, orgId, role: membership.role };
}

export async function setActiveOrg(orgId: string) {
  const { userId } = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { orgId: true },
  });
  if (!membership) throw new Error("Not a member of this organization.");

  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, { httpOnly: true, sameSite: "lax", path: "/" });
  await prisma.user.update({ where: { id: userId }, data: { defaultOrgId: orgId } });
}
