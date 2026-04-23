"use client";

import { useActionState } from "react";
import type { PlanCode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activatePlan, type BillingState } from "@/app/(app)/dashboard/facturacion/actions";

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
    price: "9 €/mes",
    description: "Perfil publicado, 5 riders, analíticas propias.",
    features: ["Perfil público", "Riders y media ilimitados", "Inbox de propuestas"],
  },
  {
    code: "PRO",
    name: "Pro",
    price: "29 €/mes",
    description: "Para promotoras y salas que envían propuestas regularmente.",
    features: ["Propuestas ilimitadas", "Hasta 5 venues", "Export CSV"],
  },
  {
    code: "OFFICE",
    name: "Office",
    price: "79 €/mes",
    description: "Oficinas y managers que representan varios artistas.",
    features: ["Roster multi-artista", "Analíticas agregadas", "Soporte prioritario"],
  },
];

export function PlanPicker({ currentPlan }: { currentPlan: PlanCode }) {
  const [state, action, pending] = useActionState<BillingState, FormData>(activatePlan, {});

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
                  {current ? "Plan actual" : pending ? "Activando…" : `Activar ${p.name}`}
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
