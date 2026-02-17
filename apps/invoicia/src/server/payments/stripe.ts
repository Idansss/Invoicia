import Stripe from "stripe";

import { env } from "@/server/env";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    typescript: true,
  });

if (process.env.NODE_ENV !== "production") globalForStripe.stripe = stripe;

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLIC_KEY);
}
