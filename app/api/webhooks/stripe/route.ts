import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { pushNotification } from "@/lib/notifications";

export const runtime = "nodejs";

function mapSubscriptionStatus(s: Stripe.Subscription.Status) {
  switch (s) {
    case "active":
    case "trialing":
      return "ACTIVE" as const;
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "EXPIRED" as const;
    case "canceled":
      return "CANCELLED" as const;
    case "paused":
      return "EXPIRED" as const;
    default:
      return "ACTIVE" as const;
  }
}

async function applySubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const plan = planFromPriceId(priceId) ?? "FREE";
  const metadataUserId =
    (sub.metadata?.userId as string | undefined) ??
    ((typeof sub.customer === "string" ? null : sub.customer?.metadata?.userId) as
      | string
      | undefined) ??
    null;

  const user = metadataUserId
    ? await prisma.user.findUnique({ where: { id: metadataUserId }, select: { id: true } })
    : await prisma.user.findFirst({
        where: {
          stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        },
        select: { id: true },
      });
  if (!user) return;

  const status = mapSubscriptionStatus(sub.status);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      planCode: plan,
      subscriptionStatus: status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEndsAt: status === "ACTIVE" ? null : undefined,
    },
  });

  if (status === "ACTIVE") {
    await pushNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Suscripción activa",
      body: `Tu plan ${plan} está activo. Gracias por confiar en Bukmi.`,
      linkUrl: "/dashboard/facturacion",
    });
  } else if (status === "EXPIRED") {
    await pushNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Problema con el pago",
      body: "No hemos podido cobrar tu suscripción. Actualiza el método de pago desde el portal.",
      linkUrl: "/dashboard/facturacion",
    });
  } else if (status === "CANCELLED") {
    await pushNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Suscripción cancelada",
      body: "Tu plan continuará activo hasta la próxima renovación.",
      linkUrl: "/dashboard/facturacion",
    });
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta firma" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Firma inválida" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId =
          (s.client_reference_id ?? (s.metadata?.userId as string | undefined)) ?? null;
        if (userId && s.customer) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId:
                typeof s.customer === "string" ? s.customer : s.customer.id,
            },
          });
        }
        if (typeof s.subscription === "string") {
          const sub = await getStripe().subscriptions.retrieve(s.subscription);
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error procesando evento" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
