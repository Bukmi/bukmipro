"use client";

import { useActionState, useState } from "react";
import type { ArtistProfile } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { GenrePicker } from "@/components/onboarding/genre-picker";
import { GENRES } from "@/app/(app)/onboarding/genres";
import { saveArtistProfile, type SaveArtistState } from "./actions";

export function ProfileForm({ profile }: { profile: ArtistProfile }) {
  const [state, formAction, pending] = useActionState<SaveArtistState, FormData>(
    saveArtistProfile,
    {}
  );
  const [bioLen, setBioLen] = useState((profile.bio ?? "").length);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <section aria-labelledby="identidad" className="grid gap-5 sm:grid-cols-2">
        <h2 id="identidad" className="sm:col-span-2 text-base font-extrabold">
          Identidad
        </h2>
        <Field id="stageName" label="Nombre artístico" required error={state?.fieldErrors?.stageName}>
          <Input name="stageName" defaultValue={profile.stageName} />
        </Field>
        <Field id="formatType" label="Formato" required error={state?.fieldErrors?.formatType}>
          <select
            id="formatType"
            name="formatType"
            defaultValue={profile.formatType}
            className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
          >
            <option value="SOLO">Solo / Cantautor</option>
            <option value="BAND">Banda</option>
            <option value="DJ">DJ</option>
          </select>
        </Field>
        <Field id="baseCity" label="Ciudad base" required error={state?.fieldErrors?.baseCity}>
          <Input name="baseCity" defaultValue={profile.baseCity ?? ""} autoComplete="address-level2" />
        </Field>
        <Field id="radiusKm" label="Radio de giras (km)" error={state?.fieldErrors?.radiusKm} hint="Hasta dónde aceptas bolos sin cobrar extra de desplazamiento.">
          <Input name="radiusKm" type="number" min={0} max={5000} defaultValue={profile.radiusKm ?? 150} />
        </Field>
      </section>

      <section aria-labelledby="bio" className="flex flex-col gap-3">
        <h2 id="bio" className="text-base font-extrabold">Bio editorial</h2>
        <Field id="bioField" label="Bio" error={state?.fieldErrors?.bio} hint="Mínimo 80 caracteres suma a completitud. 2 párrafos cortos funcionan mejor.">
          <Textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            maxLength={1200}
            rows={6}
            onChange={(e) => setBioLen(e.target.value.length)}
          />
        </Field>
        <p className="text-xs text-paper-mute" aria-live="polite">{bioLen}/1200</p>
      </section>

      <section aria-labelledby="generos" className="flex flex-col gap-3">
        <h2 id="generos" className="text-base font-extrabold">Géneros (hasta 8)</h2>
        <GenrePicker
          name="genres"
          options={GENRES}
          defaultValue={profile.genres}
          max={8}
          describedBy="genres-err"
        />
        {state?.fieldErrors?.genres && (
          <p id="genres-err" role="alert" className="text-sm font-semibold text-danger">
            {state.fieldErrors.genres}
          </p>
        )}
      </section>

      <section aria-labelledby="cache" className="grid gap-5 sm:grid-cols-3">
        <h2 id="cache" className="sm:col-span-3 text-base font-extrabold">Caché orientativo</h2>
        <Field id="cacheMin" label="Mínimo" error={state?.fieldErrors?.cacheMin} hint="Solo promotoras lo ven.">
          <Input name="cacheMin" type="number" min={0} defaultValue={profile.cacheMin ?? ""} />
        </Field>
        <Field id="cacheMax" label="Máximo" error={state?.fieldErrors?.cacheMax}>
          <Input name="cacheMax" type="number" min={0} defaultValue={profile.cacheMax ?? ""} />
        </Field>
        <Field id="currency" label="Divisa" error={state?.fieldErrors?.currency}>
          <Input name="currency" defaultValue={profile.currency} maxLength={3} />
        </Field>
      </section>

      <section aria-labelledby="redes" className="grid gap-5 sm:grid-cols-2">
        <h2 id="redes" className="sm:col-span-2 text-base font-extrabold">Plataformas</h2>
        <Field id="spotifyUrl" label="Spotify" error={state?.fieldErrors?.spotifyUrl}>
          <Input name="spotifyUrl" type="url" defaultValue={profile.spotifyUrl ?? ""} placeholder="https://open.spotify.com/artist/…" />
        </Field>
        <Field id="youtubeUrl" label="YouTube" error={state?.fieldErrors?.youtubeUrl}>
          <Input name="youtubeUrl" type="url" defaultValue={profile.youtubeUrl ?? ""} placeholder="https://youtube.com/@…" />
        </Field>
        <Field id="instagramUrl" label="Instagram" error={state?.fieldErrors?.instagramUrl}>
          <Input name="instagramUrl" type="url" defaultValue={profile.instagramUrl ?? ""} placeholder="https://instagram.com/…" />
        </Field>
        <Field id="soundcloudUrl" label="SoundCloud" error={state?.fieldErrors?.soundcloudUrl}>
          <Input name="soundcloudUrl" type="url" defaultValue={profile.soundcloudUrl ?? ""} placeholder="https://soundcloud.com/…" />
        </Field>
      </section>

      <section aria-labelledby="visibilidad" className="rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line">
        <h2 id="visibilidad" className="text-base font-extrabold">Visibilidad</h2>
        <label className="mt-3 flex items-start gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={profile.published}
            className="mt-1 h-4 w-4 rounded border-graphite-line bg-graphite-soft accent-accent"
          />
          <span className="text-sm text-paper-dim">
            <strong className="text-paper">Publicar perfil</strong> — aparecerá en el
            buscador de promotoras. Puedes desactivar en cualquier momento.
          </span>
        </label>
      </section>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" aria-live="polite" className="rounded-lg bg-success/15 p-3 text-sm text-success">
          Cambios guardados.
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-graphite-line pt-6">
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
