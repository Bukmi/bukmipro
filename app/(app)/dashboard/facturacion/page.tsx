import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LABEL, planStatus } from "@/lib/plan";
import { PlanPicker } from "@/components/app/plan-picker";
import { BillingPortalButton } from "@/components/app/billing-portal-button";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata = { title: "Facturación" };

type SearchParams = Promise<{ checkout?: string; dev?: string }>;

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      planCode: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
      email: true,
    },
  });
  if (!user) redirect("/login");

  const status = planStatus(user);
  const portalAvailable = isStripeConfigured() && Boolean(user.stripeCustomerId);
  const periodEnd = user.currentPeriodEnd
    ? new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(user.currentPeriodEnd)
    : null;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Facturación</p>
        <h1 className="text-hero">Tu plan: {PLAN_LABEL[status.code]}</h1>
        <p className="text-paper-dim">
          {status.status === "ACTIVE" && "Suscripción activa."}
          {status.trialing && `Prueba gratuita · ${status.trialDaysLeft} días restantes.`}
          {status.expired && "Tu periodo de prueba ha caducado."}
          {status.status === "CANCELLED" && "Has cancelado la suscripción."}
          {periodEnd && status.status === "ACTIVE" && ` Próxima renovación: ${periodEnd}.`}
        </p>
      </header>

      {sp.checkout === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-2xl bg-success/15 p-4 text-sm text-success"
        >
          Pago recibido. La suscripción puede tardar unos segundos en reflejarse
          si el webhook aún no ha llegado.
        </p>
      )}
      {sp.checkout === "cancelled" && (
        <p role="status" className="rounded-2xl bg-graphite-soft p-4 text-sm text-paper-dim">
          Has cancelado el checkout. Puedes reintentarlo cuando quieras.
        </p>
      )}
      {sp.dev === "1" && (
        <p role="status" className="rounded-2xl bg-accent/15 p-4 text-sm">
          Modo desarrollo: Stripe no está configurado. El plan se ha marcado
          como activo directamente para permitir pruebas.
        </p>
      )}

      <article className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Cambiar de plan</h2>
        <p className="text-sm text-paper-dim">
          Los planes son mensuales y se facturan vía Stripe. Puedes cancelar o
          actualizar el método de pago desde el portal del cliente.
        </p>
        <PlanPicker currentPlan={status.code} />
        {portalAvailable && <BillingPortalButton />}
      </article>
    </section>
  );
}
