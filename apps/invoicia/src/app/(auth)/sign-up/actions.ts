"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { hashPassword } from "@/server/password";
import { rateLimit } from "@/server/rate-limit";

const signUpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  company: z.string().max(120).optional(),
});

export async function signUpAction(input: unknown) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Please provide valid sign-up details." };
  }

  // Rate-limit by IP: max 10 sign-up attempts per hour
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit({ key: `sign-up:${ip}`, limit: 10, windowSeconds: 3600 });
  if (!limited.ok) {
    return { ok: false as const, error: "Too many sign-up attempts. Please try again later." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name.trim();
  const company = parsed.data.company?.trim() || null;
  const password = parsed.data.password;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false as const, error: "Email is already in use." };
    }

    const passwordHash = await hashPassword(password);

    // Create user and optionally create an initial org if company name is provided
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        ...(company
          ? {
              memberships: {
                create: {
                  role: "OWNER",
                  org: {
                    create: {
                      name: company,
                      currency: "USD",
                      timezone: env.DEFAULT_ORG_TIMEZONE,
                      invoicePrefix: "INV",
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
                        create: { enabled: false, type: "FLAT", amountCents: 5000, daysAfterDue: 7, name: "Default" },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        memberships: { select: { orgId: true }, take: 1 },
      },
    });

    // Set defaultOrgId if an org was created
    const firstOrgId = user.memberships[0]?.orgId ?? null;
    if (firstOrgId) {
      await prisma.user.update({ where: { id: user.id }, data: { defaultOrgId: firstOrgId } });
    }

    return { ok: true as const, userId: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        ok: false as const,
        error: "Database is unavailable. Check your DATABASE_URL and database service.",
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { ok: false as const, error: "Email is already in use." };
      }
      if (error.code === "P2021") {
        return {
          ok: false as const,
          error: "Database tables are missing. Run Prisma migrations before signing up.",
        };
      }
      return {
        ok: false as const,
        error: "Database request failed. Please try again in a moment.",
      };
    }

    console.error("signUpAction unexpected error", error);
    return { ok: false as const, error: "Unable to create account right now. Please try again." };
  }
}
