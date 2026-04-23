"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/app/(app)/dashboard/facturacion/actions";

export function BillingPortalButton() {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2 border-t border-graphite-line pt-4">
      <p className="text-sm text-paper-dim">
        ¿Quieres cambiar método de pago, descargar facturas o cancelar?
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await openBillingPortal();
            if (res?.error) alert(res.error);
          })
        }
      >
        {pending ? "Abriendo…" : "Abrir portal del cliente"}
      </Button>
    </div>
  );
}
