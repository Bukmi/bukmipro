import type { PlanCode, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, priceIdFor } from "@/lib/stripe";

function baseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

type UserLite = Pick<User, "id" | "email" | "stripeCustomerId">;

async function ensureStripeCustomer(user: UserLite): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function createCheckoutUrl(user: UserLite, plan: PlanCode): Promise<string> {
  if (!isStripeConfigured()) {
    return `${baseUrl()}/dashboard/facturacion?dev=1&plan=${plan}`;
  }
  const priceId = priceIdFor(plan);
  if (!priceId) {
    throw new Error(`No hay price configurado para el plan ${plan}.`);
  }
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl()}/dashboard/facturacion?checkout=success`,
    cancel_url: `${baseUrl()}/dashboard/facturacion?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });
  if (!session.url) throw new Error("Stripe no devolvió URL de checkout.");
  return session.url;
}

export async function createBillingPortalUrl(user: UserLite): Promise<string | null> {
  if (!isStripeConfigured() || !user.stripeCustomerId) return null;
  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl()}/dashboard/facturacion`,
  });
  return portal.url;
}
