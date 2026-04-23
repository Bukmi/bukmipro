"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Stepper } from "@/components/onboarding/stepper";
import { GenrePicker } from "@/components/onboarding/genre-picker";
import { GENRES } from "./genres";
import { completePromoterOnboarding, type OnboardingState } from "./actions";

export function PromoterWizard() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completePromoterOnboarding,
    {}
  );

  return (
    <form action={formAction} noValidate>
      <Stepper
        pending={pending}
        submitLabel="Completar onboarding"
        steps={[
          {
            id: "company",
            title: "Datos de la empresa",
            description: "Identidad legal. El CIF puede esperar a la primera contratación.",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="companyName" label="Razón social / Nombre" required error={state?.fieldErrors?.companyName}>
                  <Input name="companyName" autoComplete="organization" placeholder="Sala Apolo S.L." />
                </Field>
                <Field id="companyType" label="Tipo" required error={state?.fieldErrors?.companyType}>
                  <select
                    name="companyType"
                    defaultValue="VENUE"
                    className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
                  >
                    <option value="VENUE">Sala / Venue</option>
                    <option value="FESTIVAL">Festival</option>
                    <option value="AGENCY">Promotora / Agencia</option>
                    <option value="OFFICE">Oficina / Sello</option>
                  </select>
                </Field>
                <Field id="cif" label="CIF (opcional)" error={state?.fieldErrors?.cif} className="sm:col-span-2">
                  <Input name="cif" placeholder="B12345678" />
                </Field>
              </div>
            ),
          },
          {
            id: "venue",
            title: "Tu primera sala o festival",
            description: "Luego podrás añadir más salas desde el gestor de venues.",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="venueName" label="Nombre" required error={state?.fieldErrors?.venueName}>
                  <Input name="venueName" placeholder="Sala Apolo" />
                </Field>
                <Field id="city" label="Ciudad" required error={state?.fieldErrors?.city}>
                  <Input name="city" autoComplete="address-level2" placeholder="Barcelona" />
                </Field>
                <Field id="capacity" label="Aforo" required error={state?.fieldErrors?.capacity}>
                  <Input name="capacity" type="number" inputMode="numeric" min={1} max={200000} placeholder="600" />
                </Field>
              </div>
            ),
          },
          {
            id: "history",
            title: "Histórico (opcional)",
            description: "En Sprint 2 podrás importar CSV con eventos pasados para mejorar recomendaciones.",
            content: (
              <div className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
                <p className="font-semibold">Saltar por ahora</p>
                <p className="mt-2 text-sm text-paper-dim">
                  Podrás conectar Ticketmaster, Entradium o Dice más adelante.
                </p>
              </div>
            ),
          },
          {
            id: "prefs",
            title: "Preferencias musicales",
            description: "Géneros habituales en tu programación. Ayudan al matching IA en el Sprint 3.",
            content: (
              <div>
                <GenrePicker
                  name="preferredGenres"
                  options={GENRES}
                  max={8}
                  describedBy="prefGenres-error"
                />
                {state?.fieldErrors?.preferredGenres && (
                  <p id="prefGenres-error" role="alert" className="mt-3 text-sm font-semibold text-danger">
                    {state.fieldErrors.preferredGenres}
                  </p>
                )}
              </div>
            ),
          },
        ]}
      />
      {state?.error && (
        <p role="alert" className="mt-6 rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
