"use client";

import { useActionState } from "react";
import type { PromoterProfile } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { savePromoter, type EmpresaState } from "@/app/(app)/dashboard/empresa/actions";

export function EmpresaForm({ profile }: { profile: PromoterProfile }) {
  const [state, action, pending] = useActionState<EmpresaState, FormData>(savePromoter, {});

  return (
    <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field id="companyName" label="Razón social" required error={state?.fieldErrors?.companyName}>
        <Input name="companyName" defaultValue={profile.companyName} required minLength={2} maxLength={120} />
      </Field>
      <Field id="companyType" label="Tipo" required error={state?.fieldErrors?.companyType}>
        <select
          id="companyType"
          name="companyType"
          defaultValue={profile.companyType}
          className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
        >
          <option value="VENUE">Sala / Venue</option>
          <option value="FESTIVAL">Festival</option>
          <option value="AGENCY">Agencia</option>
          <option value="OFFICE">Oficina / Booking</option>
        </select>
      </Field>
      <Field id="cif" label="CIF / NIF" error={state?.fieldErrors?.cif}>
        <Input name="cif" defaultValue={profile.cif ?? ""} maxLength={30} />
      </Field>
      <Field id="phone" label="Teléfono" error={state?.fieldErrors?.phone}>
        <Input name="phone" defaultValue={profile.phone ?? ""} maxLength={40} autoComplete="tel" />
      </Field>
      <Field id="contactEmail" label="Email de contacto" error={state?.fieldErrors?.contactEmail} hint="Distinto al de login si quieres.">
        <Input name="contactEmail" type="email" defaultValue={profile.contactEmail ?? ""} autoComplete="email" />
      </Field>

      {state?.error && (
        <p role="alert" className="sm:col-span-2 rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" aria-live="polite" className="sm:col-span-2 rounded-lg bg-success/15 p-3 text-sm text-success">
          Datos actualizados.
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Guardando…" : "Guardar empresa"}
        </Button>
      </div>
    </form>
  );
}
