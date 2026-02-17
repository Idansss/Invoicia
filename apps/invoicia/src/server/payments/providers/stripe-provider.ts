import { createInvoiceCheckoutSession } from "@/server/payments/stripe-checkout";
import type { PaymentProvider } from "@/server/payments/provider";

export const stripeProvider: PaymentProvider = {
  key: "stripe",
  createInvoiceCheckout: async (params) => {
    const session = await createInvoiceCheckoutSession(params);
    return { provider: "stripe", providerRef: session.id, url: session.url! };
  },
};

