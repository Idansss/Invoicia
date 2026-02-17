-- Add TOTP-based two-factor authentication fields for password login.
ALTER TABLE "User"
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twoFactorSecretEnc" TEXT,
ADD COLUMN "twoFactorTempSecretEnc" TEXT,
ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3);
