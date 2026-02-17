import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { PrismaClient, Prisma } from "@prisma/client";

import { hashPassword } from "../src/server/password";
import { exportUbl21 } from "../src/compliance/renderers/ubl21";
import { toCanonicalInvoice } from "../src/server/services/canonicalize";

const prisma = new PrismaClient();

function token() {
  return crypto.randomBytes(24).toString("base64url");
}

async function reset() {
  await prisma.exportArtifact.deleteMany();
  await prisma.complianceValidationResult.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.reminderJobLog.deleteMany();
  await prisma.invoiceLateFeeApplication.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.invoiceAttachment.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reminderRule.deleteMany();
  await prisma.reminderPolicy.deleteMany();
  await prisma.lateFeePolicy.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  await reset();

  const ownerPassword = await hashPassword("Password123!");
  const staffPassword = await hashPassword("Password123!");

  const owner = await prisma.user.create({
    data: {
      name: "Owner",
      email: "owner@invoicia.local",
      passwordHash: ownerPassword,
    },
  });
  const staff = await prisma.user.create({
    data: {
      name: "Staff",
      email: "staff@invoicia.local",
      passwordHash: staffPassword,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Invoicia Demo Org",
      email: "billing@invoicia.local",
      phone: "+234 800 000 0000",
      addressLine1: "12 Adeola Odeku St",
      city: "Lagos",
      state: "Lagos",
      postalCode: "101233",
      countryCode: "NG",
      currency: "NGN",
      timezone: "Africa/Lagos",
      taxLabel: "VAT",
      taxPercent: 7,
      invoicePrefix: "INV",
      invoiceNextNumber: 4,
      complianceProfile: "BASE",
      memberships: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: staff.id, role: "STAFF" },
        ],
      },
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
        create: {
          enabled: true,
          type: "FLAT",
          amountCents: 5000,
          daysAfterDue: 7,
          name: "Default",
        },
      },
    },
  });

  await prisma.user.updateMany({
    where: { id: { in: [owner.id, staff.id] } },
    data: { defaultOrgId: org.id },
  });

  const customers = await prisma.customer.createMany({
    data: [
      {
        orgId: org.id,
        name: "Acme Procurement",
        email: "billing@acme.local",
        defaultPaymentTermsDays: 14,
        requirePurchaseOrder: false,
        countryCode: "NG",
      },
      {
        orgId: org.id,
        name: "Zenith Retail",
        email: "ap@zenith.local",
        defaultPaymentTermsDays: 30,
        requirePurchaseOrder: true,
        countryCode: "NG",
      },
      {
        orgId: org.id,
        name: "Globex Energy",
        email: "finance@globex.local",
        defaultPaymentTermsDays: 7,
        requirePurchaseOrder: false,
        countryCode: "NG",
      },
    ],
  });
  void customers;
  const [c1, c2, c3] = await prisma.customer.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
  });

  const productData = [
    { name: "Consulting (hour)", unitPriceCents: 250000, unit: "hour", taxPercent: 7 },
    { name: "Implementation", unitPriceCents: 1500000, unit: "project", taxPercent: 7 },
    { name: "Support retainer", unitPriceCents: 500000, unit: "month", taxPercent: 7 },
    { name: "Training session", unitPriceCents: 300000, unit: "session", taxPercent: 7 },
    { name: "Late fee", unitPriceCents: 5000, unit: "each", taxPercent: 0 },
  ] as const;
  await prisma.product.createMany({
    data: productData.map((p) => ({
      orgId: org.id,
      name: p.name,
      unitPriceCents: p.unitPriceCents,
      unit: p.unit,
      taxPercent: p.taxPercent,
    })),
  });
  const products = await prisma.product.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "asc" },
  });

  const today = new Date();
  const dueIn14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const draft = await prisma.invoice.create({
    data: {
      orgId: org.id,
      customerId: c1.id,
      number: "INV-2026-000001",
      token: token(),
      status: "DRAFT",
      currency: "NGN",
      issueDate: today,
      dueDate: dueIn14,
      paymentTermsDays: 14,
      taxLabel: "VAT",
      taxPercent: 7,
      lineItems: {
        create: [
          {
            productId: products[0].id,
            description: "Consulting (hour)",
            quantity: new Prisma.Decimal(2),
            unitPriceCents: products[0].unitPriceCents,
            unit: products[0].unit,
            taxPercent: 7,
          },
          {
            productId: products[1].id,
            description: "Implementation",
            quantity: new Prisma.Decimal(1),
            unitPriceCents: products[1].unitPriceCents,
            unit: products[1].unit,
            taxPercent: 7,
          },
        ],
      },
    },
  });

  const sent = await prisma.invoice.create({
    data: {
      orgId: org.id,
      customerId: c2.id,
      number: "INV-2026-000002",
      token: token(),
      status: "SENT",
      sentAt: today,
      currency: "NGN",
      issueDate: today,
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      paymentTermsDays: 7,
      purchaseOrderNumber: "PO-10001",
      taxLabel: "VAT",
      taxPercent: 7,
      lineItems: {
        create: [
          {
            productId: products[2].id,
            description: "Support retainer",
            quantity: new Prisma.Decimal(1),
            unitPriceCents: products[2].unitPriceCents,
            unit: products[2].unit,
            taxPercent: 7,
          },
        ],
      },
    },
  });

  const paid = await prisma.invoice.create({
    data: {
      orgId: org.id,
      customerId: c3.id,
      number: "INV-2026-000003",
      token: token(),
      status: "PAID",
      sentAt: today,
      paidAt: today,
      currency: "NGN",
      issueDate: today,
      dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      paymentTermsDays: 14,
      taxLabel: "VAT",
      taxPercent: 7,
      lineItems: {
        create: [
          {
            productId: products[3].id,
            description: "Training session",
            quantity: new Prisma.Decimal(3),
            unitPriceCents: products[3].unitPriceCents,
            unit: products[3].unit,
            taxPercent: 7,
          },
        ],
      },
    },
  });

  const seededPayment = await prisma.payment.create({
    data: {
      orgId: org.id,
      invoiceId: paid.id,
      provider: "manual",
      providerRef: "seed-manual-payment",
      status: "SUCCEEDED",
      amountCents: 900000,
      currency: "NGN",
      buyerEmail: c3.email,
    },
  });

  await prisma.receipt.create({
    data: {
      orgId: org.id,
      invoiceId: paid.id,
      paymentId: seededPayment.id,
      receiptNumber: "RCT-2026-SEED",
    },
  });

  await prisma.dispute.create({
    data: {
      orgId: org.id,
      invoiceId: sent.id,
      customerId: c2.id,
      reasonCode: "WRONG_PO",
      message: "PO number should be PO-10002.",
      status: "OPEN",
    },
  });

  await prisma.creditNote.create({
    data: {
      orgId: org.id,
      invoiceId: sent.id,
      number: "CN-2026-SEED",
      amountCents: 50000,
      reason: "Goodwill credit",
    },
  });

  await prisma.auditEvent.createMany({
    data: [
      { orgId: org.id, actorUserId: owner.id, action: "seed.created", entityType: "Organization", entityId: org.id },
      { orgId: org.id, actorUserId: owner.id, action: "invoice.created", entityType: "Invoice", entityId: draft.id, data: ({ number: draft.number } satisfies Prisma.InputJsonValue) },
      { orgId: org.id, actorUserId: owner.id, action: "invoice.sent", entityType: "Invoice", entityId: sent.id, data: ({ number: sent.number } satisfies Prisma.InputJsonValue) },
      { orgId: org.id, actorUserId: owner.id, action: "invoice.paid", entityType: "Invoice", entityId: paid.id, data: ({ number: paid.number } satisfies Prisma.InputJsonValue) },
    ],
  });

  // Sample XML output in /samples
  const paidFull = await prisma.invoice.findUniqueOrThrow({
    where: { id: paid.id },
    include: { org: true, customer: true, lineItems: true },
  });
  const canonical = toCanonicalInvoice({
    org: paidFull.org,
    customer: paidFull.customer,
    invoice: paidFull,
    lineItems: paidFull.lineItems,
  });
  const exported = exportUbl21(canonical, { mode: "base" });
  const samplesDir = path.join(__dirname, "..", "..", "samples");
  await fs.mkdir(samplesDir, { recursive: true });
  await fs.writeFile(path.join(samplesDir, "seed-invoice-ubl.xml"), exported.content, "utf8");

  console.log("Seeded demo data:");
  console.log("Owner: owner@invoicia.local / Password123!");
  console.log("Staff: staff@invoicia.local / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
