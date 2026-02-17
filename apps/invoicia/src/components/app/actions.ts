"use server"

import { revalidatePath } from "next/cache"

import { setActiveOrg } from "@/server/tenant"

export async function setActiveOrgAction(orgId: string) {
  await setActiveOrg(orgId)
  revalidatePath("/app")
}
