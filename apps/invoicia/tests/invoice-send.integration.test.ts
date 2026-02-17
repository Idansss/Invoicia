import fs from "node:fs/promises";

import { beforeAll, describe, expect, test, vi } from "vitest";

import { prisma } from "@/server/db";
import { hashPassword } from "@/server/password";
import { resetDb } from "./helpers/db";

vi.mock("@/server/email/mailer", () => {
  return { sendEmail: vi.fn(async () => {}) };
});

vi.mock("@/server/jobs/scheduler", () => {
  return { scheduleInvoiceAutomation: vi.fn(async () => {}) };
});

import { sendInvoice } from "@/server/services/send-invoice";
import { sendEmail } from "@/server/email/mailer";

describe("send invoice (integration)", () => {
  beforeAll(async () => {
    await resetDb();
  });

  test("create -> send generates PDF + hosted link", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Owner",
        email: "owner@test.local",
        passwordHash: await hashPassword("Password123!"),
      },
    });
    const org = await prisma.organization.create({
      data: {
        name: "Test Org",
        currency: "NGN",
        timezone: "Africa/Lagos",
        taxLabel: "VAT",
        taxPercent: 7,
        invoicePrefix: "INV",
        memberships: { create: { userId: user.id, role: "OWNER" } },
        reminderPolicies: {
          create: {
            name: "Default",
            enabled: true,
            rules: { create: [{ daysOffset: 0, templateKey: "friendly", enabled: true }] },
          },
        },
        lateFeePolicies: { create: { enabled: false, type: "FLAT", amountCents: 0, daysAfterDue: 7, name: "Default" } },
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { defaultOrgId: org.id } });

    const customer = await prisma.customer.create({
      data: {
        orgId: org.id,
        name: "Buyer Co",
        email: "buyer@test.local",
        defaultPaymentTermsDays: 14,
        requirePurchaseOrder: false,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customer.id,
        number: "INV-2026-999999",
        token: "test-token-unguessable-1234567890",
        status: "DRAFT",
        currency: "NGN",
        issueDate: new Date("2026-02-09T00:00:00Z"),
        dueDate: new Date("2026-02-23T00:00:00Z"),
        paymentTermsDays: 14,
        taxLabel: "VAT",
        taxPercent: 7,
        lineItems: {
          create: [
            {
              description: "Test line",
              quantity: 1,
              unitPriceCents: 10000,
              unit: "each",
              taxPercent: 7,
            },
          ],
        },
      },
    });

    await sendInvoice({ orgId: org.id, actorUserId: user.id, invoiceId: invoice.id });

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.status).toBe("SENT");
    expect(updated.sentAt).toBeTruthy();

    const artifacts = await prisma.exportArtifact.findMany({
      where: { invoiceId: invoice.id },
    });
    expect(artifacts.some((a) => a.kind === "INVOICE_PDF")).toBe(true);
    expect(artifacts.some((a) => a.kind === "UBL_XML")).toBe(true);

    const pdf = artifacts.find((a) => a.kind === "INVOICE_PDF")!;
    const stat = await fs.stat(pdf.storagePath);
    expect(stat.size).toBeGreaterThan(1000);

    expect(sendEmail).toHaveBeenCalled();
  });
});

