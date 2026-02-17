import { z } from "zod";

import { prisma } from "@/server/db";
import { auditEvent } from "@/server/services/audit";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  unitPriceCents: z.coerce.number().int().min(0),
  unit: z.string().min(1).max(40).default("each"),
  taxCategory: z.string().optional(),
  taxPercent: z.coerce.number().int().min(0).max(50).optional(),
});

export async function createProduct(params: {
  orgId: string;
  actorUserId: string;
  input: unknown;
}) {
  const data = productSchema.parse(params.input);
  const product = await prisma.product.create({
    data: { orgId: params.orgId, ...data },
  });

  await auditEvent({
    orgId: params.orgId,
    actorUserId: params.actorUserId,
    action: "product.created",
    entityType: "Product",
    entityId: product.id,
    data: { name: product.name },
  });

  return product;
}

