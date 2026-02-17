"use server";

import { revalidatePath } from "next/cache";

import { requireOrgRole } from "@/server/tenant";
import { createProduct } from "@/server/services/products";

export async function createProductAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const product = await createProduct({ orgId, actorUserId: userId, input });
  revalidatePath("/products");
  return { ok: true as const, productId: product.id };
}

