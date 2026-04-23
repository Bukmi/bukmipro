import type { PlanCode, SubscriptionStatus, User } from "@prisma/client";

export const PLAN_LABEL: Record<PlanCode, string> = {
  FREE: "Gratis",
  ARTIST: "Artista",
  PRO: "Pro",
  OFFICE: "Office",
};

export type PlanStatus = {
  code: PlanCode;
  status: SubscriptionStatus;
  active: boolean;
  trialing: boolean;
  trialDaysLeft: number | null;
  expired: boolean;
};

export function planStatus(
  user: Pick<User, "planCode" | "subscriptionStatus" | "trialEndsAt">
): PlanStatus {
  const now = new Date();
  const trialDaysLeft = user.trialEndsAt
    ? Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const trialing =
    user.subscriptionStatus === "TRIALING" &&
    user.trialEndsAt !== null &&
    user.trialEndsAt > now;
  const expired =
    user.subscriptionStatus === "TRIALING" &&
    user.trialEndsAt !== null &&
    user.trialEndsAt <= now;
  const active = user.subscriptionStatus === "ACTIVE" || trialing;

  return {
    code: user.planCode,
    status: user.subscriptionStatus,
    active,
    trialing,
    trialDaysLeft: trialing ? trialDaysLeft : null,
    expired,
  };
}

export function canSendProposals(status: PlanStatus) {
  return status.active;
}

export function canPublishProfile(status: PlanStatus) {
  return status.active;
}
