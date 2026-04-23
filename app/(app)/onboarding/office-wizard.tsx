"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/onboarding/stepper";
import { completeOfficeOnboarding, type OnboardingState } from "./actions";

export function OfficeWizard() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOfficeOnboarding,
    {}
  );
  const [slugInput, setSlugInput] = useState("");
  const [slugs, setSlugs] = useState<string[]>([]);

  function addSlug() {
    const s = slugInput.trim().toLowerCase();
    if (!s) return;
    if (slugs.includes(s)) return;
    if (slugs.length >= 10) return;
    setSlugs([...slugs, s]);
    setSlugInput("");
  }

  function removeSlug(s: string) {
    setSlugs(slugs.filter((x) => x !== s));
  }

  return (
    <form action={formAction} noValidate>
      {slugs.map((s) => (
        <input key={s} type="hidden" name="rosterSlugs" value={s} />
      ))}
      <Stepper
        pending={pending}
        submitLabel="Completar onboarding"
        steps={[
          {
            id: "company",
            title: "Datos de la oficina",
            description: "Identidad legal. Luego podrás editarla desde Empresa.",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="companyName" label="Nombre de la oficina" required error={state?.fieldErrors?.companyName}>
                  <Input name="companyName" autoComplete="organization" placeholder="Nómada Bookings" />
                </Field>
                <Field id="cif" label="CIF (opcional)" error={state?.fieldErrors?.cif}>
                  <Input name="cif" placeholder="B12345678" />
                </Field>
                <Field
                  id="contactEmail"
                  label="Email de contacto"
                  error={state?.fieldErrors?.contactEmail}
                  className="sm:col-span-2"
                  hint="Distinto al de login si quieres recibir avisos en otra dirección."
                >
                  <Input name="contactEmail" type="email" autoComplete="email" placeholder="bookings@ejemplo.com" />
                </Field>
              </div>
            ),
          },
          {
            id: "roster",
            title: "Tu roster inicial",
            description: "Añade los slugs de artistas que ya representas. Podrás ampliar el roster en cualquier momento.",
            content: (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    placeholder="rosalia-indie"
                    aria-label="Slug del artista"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSlug();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addSlug}
                    disabled={slugs.length >= 10 || !slugInput.trim()}
                  >
                    <Plus aria-hidden className="mr-1 h-4 w-4" /> Añadir
                  </Button>
                </div>
                {slugs.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-graphite-line p-6 text-center text-sm text-paper-mute">
                    Aún no has añadido artistas. Puedes saltar este paso y añadirlos más tarde.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2" aria-label="Roster inicial">
                    {slugs.map((s) => (
                      <li
                        key={s}
                        className="inline-flex items-center gap-2 rounded-full bg-graphite-soft px-3 py-1 text-sm ring-1 ring-graphite-line"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          aria-label={`Quitar ${s}`}
                          onClick={() => removeSlug(s)}
                          className="rounded-full p-0.5 text-paper-mute hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <X aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-paper-mute">
                  Máximo 10 en el onboarding. Sin límite desde el panel de oficina.
                </p>
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
