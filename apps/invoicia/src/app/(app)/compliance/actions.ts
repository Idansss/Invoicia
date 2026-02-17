"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/server/db";
import { requireOrgRole } from "@/server/tenant";
import { auditEvent } from "@/server/services/audit";

const schema = z.object({
  profile: z.enum(["BASE", "PEPPOL"]),
});

export async function setComplianceProfileAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"]);
  const data = schema.parse(input);
  await prisma.organization.update({
    where: { id: orgId },
    data: { complianceProfile: data.profile },
  });
  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "compliance.profile_changed",
    entityType: "Organization",
    entityId: orgId,
    data: { profile: data.profile },
  });
  revalidatePath("/compliance");
}

