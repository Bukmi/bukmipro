"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PlanCode } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import { createBillingPortalUrl, createCheckoutUrl } from "@/lib/billing";

export type BillingState = {
  ok?: boolean;
  error?: string;
};

const VALID_PLANS: PlanCode[] = ["ARTIST", "PRO", "OFFICE"];

export async function startCheckout(
  _prev: BillingState,
  formData: FormData
): Promise<BillingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión requerida." };

  const plan = String(formData.get("plan") ?? "") as PlanCode;
  if (!VALID_PLANS.includes(plan)) return { error: "Plan inválido." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) return { error: "Usuario no encontrado." };

  if (!isStripeConfigured()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        planCode: plan,
        subscriptionStatus: "ACTIVE",
        trialEndsAt: null,
      },
    });
    revalidatePath("/dashboard/facturacion");
    revalidatePath("/dashboard");
    return { ok: true };
  }

  let url: string;
  try {
    url = await createCheckoutUrl(user, plan);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al iniciar el pago." };
  }
  redirect(url);
}

export async function openBillingPortal(): Promise<BillingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión requerida." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true },
  });
  if (!user) return { error: "Usuario no encontrado." };

  const url = await createBillingPortalUrl(user);
  if (!url) return { error: "Portal no disponible. Contacta con soporte." };
  redirect(url);
}
