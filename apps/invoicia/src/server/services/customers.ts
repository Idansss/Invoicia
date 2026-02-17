import { z } from "zod";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  taxId: z.string().optional(),
  preferredLanguage: z.string().default("en"),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).default(14),
  requirePurchaseOrder: z.coerce.boolean().default(false),
});

export async function createCustomer(params: {
  orgId: string;
  actorUserId: string;
  input: unknown;
}) {
  const data = customerSchema.parse(params.input);
  const customer = await prisma.customer.create({
    data: { orgId: params.orgId, ...data },
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "customer.created",
    entityType: "Customer",
    entityId: customer.id,
    data: { name: customer.name },
  });

  return customer;
}

