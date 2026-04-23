import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LABEL, planStatus } from "@/lib/plan";
import { PlanPicker } from "@/components/app/plan-picker";

export const metadata = { title: "Facturación" };

export default async function FacturacionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      planCode: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      email: true,
    },
  });
  if (!user) redirect("/login");

  const status = planStatus(user);

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
        </p>
      </header>

      <article className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Cambiar de plan</h2>
        <p className="text-sm text-paper-dim">
          Los planes son mensuales. La facturación real se activará con Stripe.
          De momento el cambio se aplica inmediatamente en tu cuenta demo.
        </p>
        <PlanPicker currentPlan={status.code} />
      </article>
    </section>
  );
}
