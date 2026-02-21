"use server";

import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/password";
import { verifyPasswordResetToken } from "@/server/services/password-reset";
import { rateLimit } from "@/server/rate-limit";

export async function resetPasswordAction(input: {
  token: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Rate-limit by IP: max 5 attempts per 15 minutes
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit({ key: `reset-password:${ip}`, limit: 5, windowSeconds: 900 });
  if (!limited.ok) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const result = verifyPasswordResetToken(input.token);
  if (!result) {
    return { ok: false, error: "Reset link is invalid or has expired. Please request a new one." };
  }

  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, passwordResetVersion: true },
  });
  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  // Verify the token version matches — this ensures each link is single-use
  if (user.passwordResetVersion !== result.version) {
    return { ok: false, error: "Reset link has already been used. Please request a new one." };
  }

  const passwordHash = await hashPassword(input.password);
  // Atomically update password AND bump the version so old tokens are invalidated
  await prisma.user.update({
    where: { id: result.userId },
    data: { passwordHash, passwordResetVersion: { increment: 1 } },
  });

  return { ok: true };
}
