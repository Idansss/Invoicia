export type CreateCheckoutResult = {
  provider: string;
  providerRef: string;
  url: string;
};

export interface PaymentProvider {
  key: string;
  createInvoiceCheckout: (params: {
    invoiceId: string;
    token: string;
    orgId: string;
    invoiceNumber: string;
    amountCents: number;
    currency: string;
    buyerEmail?: string | null;
  }) => Promise<CreateCheckoutResult>;
}

// Provider registry (Stripe now; Paystack/Flutterwave Phase 2).
import { stripeProvider } from "@/server/payments/providers/stripe-provider";

export function getPaymentProvider(): PaymentProvider {
  return stripeProvider;
}

