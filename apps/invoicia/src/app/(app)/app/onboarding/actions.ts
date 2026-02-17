"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { requireUser } from "@/server/tenant";

const createOrgSchema = z.object({
  name: z.string().min(2).max(120),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]).default("NGN"),
  timezone: z.string().min(1).default(env.DEFAULT_ORG_TIMEZONE),
  taxLabel: z.string().optional().default("VAT"),
  taxPercent: z.coerce.number().int().min(0).max(50).optional(),
  invoicePrefix: z.string().min(2).max(10).default("INV"),
});

export async function createOrgAction(input: unknown) {
  const { userId } = await requireUser();
  const parsed = createOrgSchema.parse(input);

  const org = await prisma.organization.create({
    data: {
      name: parsed.name,
      currency: parsed.currency,
      timezone: parsed.timezone,
      taxLabel: parsed.taxLabel || null,
      taxPercent: parsed.taxPercent ?? null,
      invoicePrefix: parsed.invoicePrefix,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      reminderPolicies: {
        create: {
          name: "Default",
          enabled: true,
          rules: {
            create: [
              { daysOffset: -3, templateKey: "friendly", enabled: true },
              { daysOffset: 0, templateKey: "friendly", enabled: true },
              { daysOffset: 7, templateKey: "firm", enabled: true },
            ],
          },
        },
      },
      lateFeePolicies: {
        create: {
          enabled: false,
          type: "FLAT",
          amountCents: 5000,
          daysAfterDue: 7,
          name: "Default",
        },
      },
    },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { defaultOrgId: org.id },
  });
  const cookieStore = await cookies();
  cookieStore.set("invoicia_org", org.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { ok: true as const, orgId: org.id };
}
