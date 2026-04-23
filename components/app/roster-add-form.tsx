"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { addRosterArtist, type RosterState } from "@/app/(app)/dashboard/oficina/actions";

export function RosterAddForm() {
  const [state, action, pending] = useActionState<RosterState, FormData>(addRosterArtist, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line sm:flex-row sm:items-end"
    >
      <Field id="slug" label="Slug del artista" hint="p.ej. rosalia-indie">
        <Input name="slug" required minLength={2} maxLength={120} autoComplete="off" placeholder="rosalia-indie" />
      </Field>
      <Field id="note" label="Nota (opcional)">
        <Input name="note" maxLength={200} placeholder="Agente responsable, % comisión..." />
      </Field>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Añadiendo…" : "Añadir al roster"}
      </Button>
      {state?.error && (
        <p role="alert" className="text-sm text-danger sm:ml-2">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" aria-live="polite" className="text-sm text-success sm:ml-2">
          Artista añadido.
        </p>
      )}
    </form>
  );
}
