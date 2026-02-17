"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { hashPassword } from "@/server/password";

const signUpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function signUpAction(input: unknown) {
  const parsed = signUpSchema.parse(input);
  const email = parsed.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false as const, error: "Email is already in use." };
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email,
        passwordHash,
      },
      select: { id: true },
    });

    return { ok: true as const, userId: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return {
        ok: false as const,
        error: "Database is unavailable. Check your DATABASE_URL and database service.",
      };
    }
    throw error;
  }
}
