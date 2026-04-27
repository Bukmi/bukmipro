"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Stepper } from "@/components/onboarding/stepper";
import { GenrePicker } from "@/components/onboarding/genre-picker";
import { GENRES } from "./genres";
import { completeArtistOnboarding, type OnboardingState } from "./actions";

export function ArtistWizard({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeArtistOnboarding,
    {}
  );

  return (
    <form action={formAction} noValidate>
      <Stepper
        pending={pending}
        submitLabel="Completar onboarding"
        steps={[
          {
            id: "basics",
            title: "Datos básicos",
            description: "Así aparecerás en el buscador de promotoras.",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="stageName" label="Nombre artístico" required error={state?.fieldErrors?.stageName}>
                  <Input name="stageName" autoComplete="nickname" placeholder="Ej. Rosalía Indie" />
                </Field>
                <Field
                  id="formatType"
                  label="Formato"
                  required
                  error={state?.fieldErrors?.formatType}
                  hint="SOLO para artista individual, BAND para banda, DJ para DJ sets."
                >
                  <select
                    name="formatType"
                    defaultValue="SOLO"
                    className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
                  >
                    <option value="SOLO">Solo / Cantautor</option>
                    <option value="BAND">Banda</option>
                    <option value="DJ">DJ</option>
                  </select>
                </Field>
                <Field id="baseCity" label="Ciudad base" required error={state?.fieldErrors?.baseCity} className="sm:col-span-2">
                  <Input name="baseCity" autoComplete="address-level2" placeholder="Madrid" />
                </Field>
                <p className="text-xs text-paper-mute sm:col-span-2">Cuenta asociada: {defaultEmail}</p>
              </div>
            ),
          },
          {
            id: "genres",
            title: "Géneros musicales",
            description: "Elige hasta 5. Las promotoras filtran por esto.",
            content: (
              <div>
                <GenrePicker name="genres" options={GENRES} max={5} describedBy="genres-error" />
                {state?.fieldErrors?.genres && (
                  <p id="genres-error" role="alert" className="mt-3 text-sm font-semibold text-danger">
                    {state.fieldErrors.genres}
                  </p>
                )}
              </div>
            ),
          },
          {
            id: "links",
            title: "Links y caché (opcional)",
            description:
              "Añade tus redes y un caché orientativo para aparecer en más búsquedas. Puedes rellenarlo ahora o más tarde.",
            content: (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="spotifyUrl"
                  label="Spotify"
                  hint="https://open.spotify.com/artist/…"
                  error={state?.fieldErrors?.spotifyUrl}
                >
                  <Input
                    name="spotifyUrl"
                    type="url"
                    placeholder="https://open.spotify.com/artist/…"
                    autoComplete="off"
                  />
                </Field>
                <Field
                  id="youtubeUrl"
                  label="YouTube"
                  hint="https://youtube.com/@tucanal"
                  error={state?.fieldErrors?.youtubeUrl}
                >
                  <Input
                    name="youtubeUrl"
                    type="url"
                    placeholder="https://youtube.com/@tucanal"
                    autoComplete="off"
                  />
                </Field>
                <Field
                  id="instagramUrl"
                  label="Instagram"
                  hint="https://instagram.com/tunombre"
                  error={state?.fieldErrors?.instagramUrl}
                >
                  <Input
                    name="instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/tunombre"
                    autoComplete="off"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-4 text-sm text-paper-dim">
                    Caché orientativo — ayuda a las promotoras a filtrar por presupuesto.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="cacheMin"
                      label="Caché mínimo (€)"
                      error={state?.fieldErrors?.cacheMin}
                    >
                      <Input
                        name="cacheMin"
                        type="number"
                        min={0}
                        step={50}
                        placeholder="500"
                      />
                    </Field>
                    <Field
                      id="cacheMax"
                      label="Caché máximo (€)"
                      error={state?.fieldErrors?.cacheMax}
                    >
                      <Input
                        name="cacheMax"
                        type="number"
                        min={0}
                        step={50}
                        placeholder="2000"
                      />
                    </Field>
                  </div>
                </div>
                <input type="hidden" name="currency" value="EUR" />
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
