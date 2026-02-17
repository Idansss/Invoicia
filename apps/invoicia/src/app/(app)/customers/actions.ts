"use server";

import { revalidatePath } from "next/cache";

import { requireOrgRole } from "@/server/tenant";
import { createCustomer } from "@/server/services/customers";

export async function createCustomerAction(input: unknown) {
  const { orgId, userId } = await requireOrgRole(["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"]);
  const customer = await createCustomer({ orgId, actorUserId: userId, input });
  revalidatePath("/customers");
  return { ok: true as const, customerId: customer.id };
}

