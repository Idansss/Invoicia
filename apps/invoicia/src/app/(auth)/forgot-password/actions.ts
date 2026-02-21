"use server";

import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email/mailer";
import { PasswordResetEmail } from "@/server/email/templates/password-reset";
import { createPasswordResetToken } from "@/server/services/password-reset";
import { env } from "@/server/env";
import { rateLimit } from "@/server/rate-limit";

export async function forgotPasswordAction(input: { email: string }): Promise<{ ok: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: true }; // Always return ok to prevent email enumeration

  // Rate-limit by email: max 3 requests per 15 minutes
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await rateLimit({ key: `forgot-password:${email}:${ip}`, limit: 3, windowSeconds: 900 });
  if (!limited.ok) return { ok: true }; // Silent — don't reveal rate limit to caller

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, passwordResetVersion: true },
  });

  if (user?.passwordHash) {
    const token = createPasswordResetToken(user.id, user.passwordResetVersion);
    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your Invoicia password",
      react: PasswordResetEmail({ resetUrl }),
    });
  }

  return { ok: true };
}
