"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { applyToCasting } from "./actions";
import type { ApplicationStatus } from "@prisma/client";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendiente de respuesta",
  ACCEPTED: "¡Seleccionado!",
  REJECTED: "No seleccionado",
};
const STATUS_TONE: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  ACCEPTED: "bg-accent/10 border-accent/30 text-accent",
  REJECTED: "bg-danger/10 border-danger/30 text-danger",
};

type Props = {
  castingCallId: string;
  isOpen: boolean;
  myApplication: { status: ApplicationStatus; message: string | null } | null;
};

export function ApplyPanel({ castingCallId, isOpen, myApplication }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (myApplication) {
    return (
      <div className={cn("rounded-2xl border p-6", STATUS_TONE[myApplication.status])}>
        <p className="font-bold">{STATUS_LABEL[myApplication.status]}</p>
        {myApplication.status === "PENDING" && (
          <p className="mt-1 text-sm opacity-80">La promotora revisará tu candidatura cuando cierre el plazo.</p>
        )}
        {myApplication.status === "ACCEPTED" && (
          <p className="mt-1 text-sm opacity-80">La promotora se pondrá en contacto contigo para cerrar los detalles.</p>
        )}
        {myApplication.status === "REJECTED" && (
          <p className="mt-1 text-sm opacity-80">Esta vez no has sido seleccionado. Sigue aplicando a otros eventos.</p>
        )}
        {myApplication.message && (
          <p className="mt-3 text-xs opacity-60 border-t border-current/20 pt-3">Tu mensaje: {myApplication.message}</p>
        )}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-graphite-line p-6 text-center text-paper-dim">
        El plazo de aplicación ha terminado.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = (e.currentTarget.elements.namedItem("message") as HTMLTextAreaElement).value;
    startTransition(async () => {
      const result = await applyToCasting(castingCallId, message);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line flex flex-col gap-4">
      <h2 className="font-bold text-lg">Aplicar a este evento</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-semibold text-paper">
            Mensaje opcional
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Cuéntale a la promotora por qué encajas perfectamente en este evento..."
            className="w-full rounded-xl border border-graphite-line bg-graphite px-4 py-3 text-paper placeholder:text-paper-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando candidatura..." : "Aplicar al evento"}
        </Button>
      </form>
    </div>
  );
}
