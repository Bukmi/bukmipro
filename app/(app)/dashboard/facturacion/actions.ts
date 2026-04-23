"use server";

import { revalidatePath } from "next/cache";
import type { PlanCode } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type BillingState = {
  ok?: boolean;
  error?: string;
};

const VALID_PLANS: PlanCode[] = ["ARTIST", "PRO", "OFFICE"];

export async function activatePlan(
  _prev: BillingState,
  formData: FormData
): Promise<BillingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sesión requerida." };

  const plan = String(formData.get("plan") ?? "") as PlanCode;
  if (!VALID_PLANS.includes(plan)) return { error: "Plan inválido." };

  // Stub: real Stripe checkout goes here. For now we mark the plan active.
  await prisma.user.update({
    where: { id: session.user.id },
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
