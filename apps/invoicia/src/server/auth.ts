import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { z } from "zod";

import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { verifyPassword } from "@/server/password";
import { decryptTwoFactorSecret, verifyTwoFactorCode } from "@/server/two-factor";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  twoFactorCode: z.string().trim().optional(),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            twoFactorEnabled: true,
            twoFactorSecretEnc: true,
          },
        });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        if (user.twoFactorEnabled) {
          if (!parsed.data.twoFactorCode) {
            throw new Error("2FA_REQUIRED");
          }
          if (!user.twoFactorSecretEnc) {
            throw new Error("2FA_NOT_CONFIGURED");
          }

          const secret = decryptTwoFactorSecret(user.twoFactorSecretEnc);
          const validCode = verifyTwoFactorCode(secret, parsed.data.twoFactorCode);
          if (!validCode) {
            throw new Error("2FA_INVALID");
          }
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (!user?.id || account?.provider === "credentials") return true;

      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { twoFactorEnabled: true },
      });
      if (!existingUser?.twoFactorEnabled) return true;

      return "/sign-in?error=2FA_REQUIRED_USE_PASSWORD";
    },
    jwt: async ({ token, user }) => {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}
