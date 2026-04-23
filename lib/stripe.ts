import Stripe from "stripe";
import type { PlanCode } from "@prisma/client";

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY no está definida.");
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    });
  }
  return cached;
}

export const STRIPE_PRICE_ENV: Record<PlanCode, string | undefined> = {
  FREE: undefined,
  ARTIST: process.env.STRIPE_PRICE_ARTIST,
  PRO: process.env.STRIPE_PRICE_PRO,
  OFFICE: process.env.STRIPE_PRICE_OFFICE,
};

export function priceIdFor(plan: PlanCode): string | null {
  return STRIPE_PRICE_ENV[plan] ?? null;
}

export function planFromPriceId(priceId: string | null | undefined): PlanCode | null {
  if (!priceId) return null;
  for (const [plan, id] of Object.entries(STRIPE_PRICE_ENV)) {
    if (id && id === priceId) return plan as PlanCode;
  }
  return null;
}
