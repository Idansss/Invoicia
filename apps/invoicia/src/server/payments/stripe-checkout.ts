import { stripe } from "@/server/payments/stripe";
import { env } from "@/server/env";

export async function createInvoiceCheckoutSession(params: {
  invoiceId: string;
  token: string;
  orgId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  buyerEmail?: string | null;
}) {
  const successUrl = `${env.APP_BASE_URL}/i/${params.token}?paid=1`;
  const cancelUrl = `${env.APP_BASE_URL}/i/${params.token}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.buyerEmail || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amountCents,
          product_data: { name: `Invoice ${params.invoiceNumber}` },
        },
      },
    ],
    metadata: {
      invoiceId: params.invoiceId,
      orgId: params.orgId,
      token: params.token,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

