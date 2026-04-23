"use client";

import { useActionState } from "react";
import type { Venue } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createProposal, type ProposalState } from "@/app/(app)/dashboard/propuestas/actions";

type Props = {
  artistProfileId: string;
  artistName: string;
  venues: Pick<Venue, "id" | "name" | "city">[];
  defaultCurrency?: string;
};

export function ProposalForm({ artistProfileId, artistName, venues, defaultCurrency = "EUR" }: Props) {
  const [state, formAction, pending] = useActionState<ProposalState, FormData>(
    createProposal,
    {}
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="artistProfileId" value={artistProfileId} />
      <p className="text-sm text-paper-dim">
        Envía una propuesta a <strong className="text-paper">{artistName}</strong>. Recibirá una
        notificación y podrá aceptar, negociar o rechazar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="eventDate" label="Fecha del evento" required error={state?.fieldErrors?.eventDate}>
          <Input name="eventDate" type="date" required />
        </Field>
        <Field id="slot" label="Franja (opcional)" error={state?.fieldErrors?.slot} hint="Ej: 22:00 - 23:30">
          <Input name="slot" placeholder="22:00 - 23:30" />
        </Field>
      </div>

      {venues.length > 0 && (
        <Field id="venueId" label="Venue" hint="Elige uno de tus recintos para autocompletar.">
          <select
            id="venueId"
            name="venueId"
            defaultValue=""
            className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
          >
            <option value="">Evento externo / sin venue fijo</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.city}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="venueName" label="Nombre del recinto" required error={state?.fieldErrors?.venueName}>
          <Input name="venueName" required minLength={2} maxLength={120} />
        </Field>
        <Field id="eventCity" label="Ciudad" required error={state?.fieldErrors?.eventCity}>
          <Input name="eventCity" required minLength={2} maxLength={80} autoComplete="address-level2" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="budgetMin" label="Presupuesto mínimo" error={state?.fieldErrors?.budgetMin}>
          <Input name="budgetMin" type="number" min={0} placeholder="800" />
        </Field>
        <Field id="budgetMax" label="Presupuesto máximo" error={state?.fieldErrors?.budgetMax}>
          <Input name="budgetMax" type="number" min={0} placeholder="1500" />
        </Field>
        <Field id="currency" label="Divisa">
          <Input name="currency" defaultValue={defaultCurrency} maxLength={3} />
        </Field>
      </div>

      <Field id="notes" label="Mensaje" required error={state?.fieldErrors?.notes} hint="Cuenta el contexto: festival, tipo de público, horario, si hay backline.">
        <Textarea name="notes" required minLength={20} maxLength={2000} rows={5} />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Enviando…" : "Enviar propuesta"}
        </Button>
      </div>
    </form>
  );
}
