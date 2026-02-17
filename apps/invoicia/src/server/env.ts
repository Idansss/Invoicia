import { z } from "zod";

import { ensureEnvLoaded } from "@/server/load-env";

ensureEnvLoaded();

const envSchema = z.object({
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(20),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().min(1),

  STRIPE_PUBLIC_KEY: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),

  STORAGE_BACKEND: z.enum(["local", "vercel-blob"]).default("local"),
  STORAGE_DIR: z.string().default("storage"),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),
  DEFAULT_ORG_TIMEZONE: z.string().default("Africa/Lagos"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
