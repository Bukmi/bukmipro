import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_LABEL, type PlanStatus } from "@/lib/plan";

export function PlanBanner({ status }: { status: PlanStatus }) {
  if (status.status === "ACTIVE") return null;

  if (status.expired) {
    return (
      <aside
        role="alert"
        className="flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-center gap-2 text-paper">
          <AlertTriangle aria-hidden className="h-4 w-4 text-danger" />
          Tu periodo de prueba ha caducado. Reactiva tu cuenta para seguir enviando propuestas.
        </p>
        <Link
          href="/dashboard/facturacion"
          className="inline-flex w-fit items-center rounded-xl border border-danger px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          Activar plan
        </Link>
      </aside>
    );
  }

  if (status.trialing) {
    const days = status.trialDaysLeft ?? 0;
    const urgent = days <= 3;
    return (
      <aside
        role="status"
        className={cn(
          "flex flex-col gap-2 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between",
          urgent
            ? "border-accent/60 bg-accent/10"
            : "border-graphite-line bg-graphite-soft"
        )}
      >
        <p className="flex items-center gap-2 text-paper">
          <Sparkles aria-hidden className={cn("h-4 w-4", urgent ? "text-accent" : "text-paper-dim")} />
          Plan {PLAN_LABEL[status.code]} en prueba ·
          {" "}{days > 1 ? `${days} días restantes` : days === 1 ? "último día" : "termina hoy"}
        </p>
        <Link
          href="/dashboard/facturacion"
          className="inline-flex w-fit items-center rounded-xl border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
        >
          Ver planes
        </Link>
      </aside>
    );
  }

  return null;
}
