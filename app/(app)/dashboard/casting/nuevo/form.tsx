"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCasting, type CastingState } from "./actions";

const initial: CastingState = {};

export function CreateCastingForm() {
  const [state, action, pending] = useActionState(createCasting, initial);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-2xl">
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <Field id="title" label="Nombre del evento" required error={state.fieldErrors?.title}>
        <Input name="title" placeholder="Festival de Jazz en el Parque" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="venueName" label="Nombre del venue" required error={state.fieldErrors?.venueName}>
          <Input name="venueName" placeholder="Sala Apolo" />
        </Field>
        <Field id="venueCity" label="Ciudad" required error={state.fieldErrors?.venueCity}>
          <Input name="venueCity" placeholder="Barcelona" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="eventDate" label="Fecha del evento" required error={state.fieldErrors?.eventDate}>
          <Input name="eventDate" type="date" />
        </Field>
        <Field id="formatType" label="Formato buscado" error={state.fieldErrors?.formatType}>
          <select
            id="formatType"
            name="formatType"
            className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
          >
            <option value="">Cualquier formato</option>
            <option value="SOLISTA">Solista</option>
            <option value="DUO">Dúo</option>
            <option value="TRIO">Trío</option>
            <option value="GRUPO">Grupo (3-10 pax)</option>
            <option value="COMPANIA">Compañía (+10 pax)</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="estimatedCache" label="Caché estimado (€)" hint="Opcional" error={state.fieldErrors?.estimatedCache}>
          <Input name="estimatedCache" type="number" min={0} placeholder="1500" />
        </Field>
        <Field
          id="applyDeadlineDays"
          label="Plazo de aplicación (días)"
          hint="Días desde hoy para recibir candidaturas"
          error={state.fieldErrors?.applyDeadlineDays}
        >
          <select
            id="applyDeadlineDays"
            name="applyDeadlineDays"
            className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
          >
            <option value="2">2 días</option>
            <option value="3" selected>3 días</option>
            <option value="5">5 días</option>
            <option value="7">7 días</option>
            <option value="14">14 días</option>
          </select>
        </Field>
      </div>

      <Field id="description" label="Descripción del evento" hint="Estilo musical, requisitos técnicos, etc." error={state.fieldErrors?.description}>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe el evento, el público esperado y cualquier requisito especial..."
          className="w-full rounded-xl border border-graphite-line bg-graphite-soft px-4 py-3 text-paper placeholder:text-paper-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite resize-none"
        />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Publicando..." : "Publicar evento"}
        </Button>
      </div>
    </form>
  );
}
