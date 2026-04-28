"use client";

import { useActionState } from "react";
import type { PlanCode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startCheckout, type BillingState } from "@/app/(app)/dashboard/facturacion/actions";

type Plan = {
  code: PlanCode;
  name: string;
  price: string;
  description: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    code: "ARTIST",
    name: "Artista",
    price: "24,99 €/mes",
    description: "Perfil publicado en el directorio y acceso al inbox de propuestas.",
    features: ["Perfil público en el buscador", "Media y riders ilimitados", "Inbox de propuestas", "Analíticas propias"],
  },
  {
    code: "PRO",
    name: "Pro",
    price: "49,99 €/mes",
    description: "Todo lo del plan Artista más herramientas avanzadas de gestión.",
    features: ["Todo el plan Artista", "Prioridad en búsquedas", "Export CSV", "Soporte prioritario"],
  },
  {
    code: "OFFICE",
    name: "Office",
    price: "19,99 €/mes",
    description: "Para managers y oficinas. Gestiona varios artistas desde un perfil. −20% vs plan Artista.",
    features: ["Roster multi-artista", "Analíticas agregadas", "Un perfil, varios artistas"],
  },
];

export function PlanPicker({ currentPlan }: { currentPlan: PlanCode }) {
  const [state, action, pending] = useActionState<BillingState, FormData>(startCheckout, {});

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.code === currentPlan;
          return (
            <li
              key={p.code}
              className={cn(
                "flex flex-col gap-3 rounded-2xl p-5 ring-1",
                current
                  ? "bg-accent/10 ring-accent"
                  : "bg-graphite-soft ring-graphite-line"
              )}
            >
              <header className="flex items-baseline justify-between">
                <h3 className="text-lg font-extrabold">{p.name}</h3>
                <span className="text-sm font-bold text-paper-dim">{p.price}</span>
              </header>
              <p className="text-sm text-paper-dim">{p.description}</p>
              <ul className="flex flex-col gap-1 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <form action={action} className="mt-auto">
                <input type="hidden" name="plan" value={p.code} />
                <Button
                  type="submit"
                  variant={current ? "secondary" : "primary"}
                  disabled={pending || current}
                  aria-busy={pending}
                  className="w-full"
                >
                  {current ? "Plan actual" : pending ? "Redirigiendo…" : `Suscribirse a ${p.name}`}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" aria-live="polite" className="rounded-lg bg-success/15 p-3 text-sm text-success">
          Plan actualizado.
        </p>
      )}
    </div>
  );
}
