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
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Please provide valid sign-up details." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name.trim();
  const password = parsed.data.password;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false as const, error: "Email is already in use." };
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
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
