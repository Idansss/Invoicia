"use server"

import { revalidatePath } from "next/cache"
import QRCode from "qrcode"
import { z } from "zod"

import { prisma } from "@/server/db"
import { hashPassword, verifyPassword } from "@/server/password"
import { auditEvent } from "@/server/services/audit"
import { requireOrgRole } from "@/server/tenant"
import {
  createOtpAuthUrl,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  formatTwoFactorSecret,
  generateTwoFactorSecret,
  verifyTwoFactorCode,
} from "@/server/two-factor"

const organizationSchema = z.object({
  organizationName: z.string().min(1).max(200),
  legalName: z.string().max(200).optional().default(""),
  email: z.string().email().max(200).optional().or(z.literal("")).default(""),
  phone: z.string().max(40).optional().or(z.literal("")).default(""),
  addressLine1: z.string().max(200).optional().or(z.literal("")).default(""),
  addressLine2: z.string().max(200).optional().or(z.literal("")).default(""),
  city: z.string().max(120).optional().or(z.literal("")).default(""),
  state: z.string().max(120).optional().or(z.literal("")).default(""),
  postalCode: z.string().max(40).optional().or(z.literal("")).default(""),
  countryCode: z.string().max(2).optional().or(z.literal("")).default(""),
  timezone: z.string().min(1),
  currency: z.enum(["USD", "EUR", "GBP", "NGN"]),
  invoicePrefix: z
    .string()
    .min(2, "Invoice prefix must be at least 2 characters")
    .max(12, "Invoice prefix must be at most 12 characters"),
  taxLabel: z.string().max(40).optional().or(z.literal("")).default(""),
  taxPercent: z.number().int().min(0).max(100).nullable().optional(),
  taxId: z.string().max(80).optional().or(z.literal("")).default(""),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
})

const twoFactorCodeSchema = z.object({
  code: z.string().min(6).max(12),
})

export async function saveOrganizationSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"])
  const data = organizationSchema.parse(input)
  const normalizedInvoicePrefix = data.invoicePrefix.trim().toUpperCase()
  if (!/^[A-Z0-9-]+$/.test(normalizedInvoicePrefix)) {
    throw new Error("Invoice prefix can only include letters, numbers, and hyphens.")
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.organizationName.trim(),
      legalName: data.legalName.trim() || null,
      email: data.email.trim().toLowerCase() || null,
      phone: data.phone.trim() || null,
      addressLine1: data.addressLine1.trim() || null,
      addressLine2: data.addressLine2.trim() || null,
      city: data.city.trim() || null,
      state: data.state.trim() || null,
      postalCode: data.postalCode.trim() || null,
      countryCode: data.countryCode.trim().toUpperCase() || null,
      timezone: data.timezone,
      currency: data.currency,
      invoicePrefix: normalizedInvoicePrefix,
      taxLabel: data.taxLabel.trim() || null,
      taxPercent: data.taxPercent ?? null,
      taxId: data.taxId.trim() || null,
    },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.organization.updated",
    entityType: "Organization",
    entityId: orgId,
    data,
  })

  revalidatePath("/settings")
}

export async function updatePasswordSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const data = passwordSchema.parse(input)
  if (data.newPassword !== data.confirmPassword) {
    throw new Error("New password and confirmation do not match.")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  })
  if (!user?.passwordHash) {
    throw new Error("Password login is not configured for this account.")
  }

  const validPassword = await verifyPassword(data.currentPassword, user.passwordHash)
  if (!validPassword) {
    throw new Error("Current password is incorrect.")
  }

  const nextHash = await hashPassword(data.newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: nextHash },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.password.updated",
    entityType: "User",
    entityId: user.id,
  })
}

export async function startTwoFactorEnrollmentSettingsAction() {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, twoFactorEnabled: true },
  })
  if (!user?.email) {
    throw new Error("Unable to start 2FA setup. Account email is missing.")
  }

  const secret = generateTwoFactorSecret()
  const encryptedTempSecret = encryptTwoFactorSecret(secret)
  const otpAuthUrl = createOtpAuthUrl({
    issuer: "Invoicia",
    accountName: user.email,
    secret,
  })
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, { margin: 1, width: 240 })

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorTempSecretEnc: encryptedTempSecret },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.security.2fa.setup_started",
    entityType: "User",
    entityId: userId,
    data: { alreadyEnabled: user.twoFactorEnabled },
  })

  return {
    qrCodeDataUrl,
    manualEntryKey: formatTwoFactorSecret(secret),
  }
}

export async function confirmTwoFactorEnrollmentSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const data = twoFactorCodeSchema.parse(input)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorTempSecretEnc: true },
  })
  if (!user?.twoFactorTempSecretEnc) {
    throw new Error("Start setup first, then verify your code.")
  }

  const tempSecret = decryptTwoFactorSecret(user.twoFactorTempSecretEnc)
  const validCode = verifyTwoFactorCode(tempSecret, data.code)
  if (!validCode) {
    throw new Error("Invalid authenticator code. Please try again.")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorEnabledAt: new Date(),
      twoFactorSecretEnc: encryptTwoFactorSecret(tempSecret),
      twoFactorTempSecretEnc: null,
    },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.security.2fa.enabled",
    entityType: "User",
    entityId: userId,
  })

  revalidatePath("/settings")
  return { ok: true as const }
}

export async function disableTwoFactorSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF", "READONLY"])
  const data = twoFactorCodeSchema.parse(input)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecretEnc: true },
  })
  if (!user?.twoFactorEnabled || !user.twoFactorSecretEnc) {
    throw new Error("Two-factor authentication is not enabled.")
  }

  const secret = decryptTwoFactorSecret(user.twoFactorSecretEnc)
  const validCode = verifyTwoFactorCode(secret, data.code)
  if (!validCode) {
    throw new Error("Invalid authenticator code. Enter a current 6-digit code to disable 2FA.")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorEnabledAt: null,
      twoFactorSecretEnc: null,
      twoFactorTempSecretEnc: null,
    },
  })

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.security.2fa.disabled",
    entityType: "User",
    entityId: userId,
  })

  revalidatePath("/settings")
  return { ok: true as const }
}

export async function inviteTeamMemberSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN"])
  const payload = z
    .object({
      email: z.string().email(),
      role: z.enum(["ADMIN", "ACCOUNTANT", "STAFF", "READONLY"]).default("STAFF"),
    })
    .parse(input)

  const event = await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.team.invite_requested",
    entityType: "Organization",
    entityId: orgId,
    data: payload,
  })
  return { invitationId: event.id }
}

export async function manageTeamMemberSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN"])
  const payload = z
    .object({
      email: z.string().email(),
      action: z.enum(["change-role", "remove", "resend-invite"]).default("change-role"),
    })
    .parse(input)

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: "settings.team.member_manage_requested",
    entityType: "Organization",
    entityId: orgId,
    data: payload,
  })
}

export async function billingSettingsAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT"])
  const payload = z
    .object({
      action: z.enum(["upgrade", "payment-update"]),
      plan: z.string().optional(),
      method: z.string().optional(),
    })
    .parse(input)

  await auditEvent({
    orgId,
    actorUserId: userId,
    action: `settings.billing.${payload.action}`,
    entityType: "Organization",
    entityId: orgId,
    data: payload,
  })
}
