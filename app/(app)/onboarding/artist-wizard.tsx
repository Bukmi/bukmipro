"use client";

import { useActionState, useState, useTransition } from "react";
import { Music2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/onboarding/stepper";
import { GenrePicker } from "@/components/onboarding/genre-picker";
import { GENRES } from "./genres";
import { PERFORMANCE_CATEGORIES } from "@/lib/categories";
import {
  completeArtistOnboarding,
  importFromSpotify,
  type OnboardingState,
  type SpotifyImportResult,
} from "./actions";

const BIO_MIN = 80;
const BIO_MAX = 1200;

// Map Spotify genres (english, lowercase) to our genre list (Spanish display labels).
// We do a loose substring match: if "indie" is in a Spotify genre, match "Indie".
function normalizeGenres(spotifyGenres: string[]): string[] {
  const known = GENRES as readonly string[];
  const matched: string[] = [];

  for (const genre of known) {
    const lower = genre.toLowerCase();
    if (spotifyGenres.some((sg) => sg.toLowerCase().includes(lower) || lower.includes(sg.toLowerCase()))) {
      matched.push(genre);
    }
    if (matched.length >= 8) break;
  }
  return matched;
}

// ---------------------------------------------------------------------------
// Spotify import mini-form
// ---------------------------------------------------------------------------

function SpotifyImporter({
  onImport,
}: {
  onImport: (result: Extract<SpotifyImportResult, { ok: true }>) => void;
}) {
  const [result, dispatch, importing] = useActionState<
    SpotifyImportResult | null,
    FormData
  >(importFromSpotify, null);

  // Fire callback on successful import
  const [notified, setNotified] = useState(false);
  if (result?.ok && !notified) {
    setNotified(true);
    onImport(result);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={dispatch} className="flex flex-col gap-3">
        <Field
          id="spotifyUrl"
          label="Tu perfil de Spotify"
          hint="https://open.spotify.com/artist/…"
          error={!result?.ok ? result?.error : undefined}
        >
          <div className="flex gap-2">
            <Input
              name="spotifyUrl"
              type="url"
              placeholder="https://open.spotify.com/artist/…"
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" disabled={importing} className="shrink-0">
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Importar"
              )}
            </Button>
          </div>
        </Field>
      </form>

      {result?.ok && (
        <div className="flex items-start gap-3 rounded-xl bg-accent/10 border border-accent/30 p-4">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-paper">
              ¡Importado! Datos de {result.artist.name}
            </p>
            <p className="text-xs text-paper-dim mt-0.5">
              {result.artist.followers.toLocaleString("es-ES")} seguidores
              {result.artist.genres.length > 0 &&
                ` · ${result.artist.genres.slice(0, 3).join(", ")}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export function ArtistWizard({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeArtistOnboarding,
    {}
  );

  const [bioLen, setBioLen] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("LIVE_MUSIC");

  // Spotify-enriched data
  const [spotifyData, setSpotifyData] = useState<
    Extract<SpotifyImportResult, { ok: true }> | null
  >(null);

  // Pre-filled values from Spotify
  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [cacheMin, setCacheMin] = useState("");
  const [cacheMax, setCacheMax] = useState("");

  const isMusicOrDJ =
    selectedCategory === "LIVE_MUSIC" || selectedCategory === "DJ";

  function handleSpotifyImport(
    result: Extract<SpotifyImportResult, { ok: true }>
  ) {
    setSpotifyData(result);
    // Pre-fill form fields
    if (!stageName) setStageName(result.artist.name);
    if (!bio && result.bio) {
      setBio(result.bio);
      setBioLen(result.bio.length);
    }
    const mapped = normalizeGenres(result.artist.genres);
    if (mapped.length > 0 && selectedGenres.length === 0) {
      setSelectedGenres(mapped);
    }
    if (!cacheMin && result.cacheMin) setCacheMin(String(result.cacheMin));
    if (!cacheMax && result.cacheMax) setCacheMax(String(result.cacheMax));
  }

  const steps = [
    // -------------------------------------------------------------------
    // Step 1: Category
    // -------------------------------------------------------------------
    {
      id: "category",
      title: "¿Qué tipo de artista eres?",
      description: "Esto ayuda a las promotoras a encontrarte en el buscador.",
      content: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <input type="hidden" name="category" value={selectedCategory} />
          {PERFORMANCE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelectedCategory(c.value)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite ${
                selectedCategory === c.value
                  ? "border-accent bg-accent/10 text-paper"
                  : "border-graphite-line bg-graphite-soft text-paper-dim hover:border-accent/50 hover:text-paper"
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {c.emoji}
              </span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      ),
    },

    // -------------------------------------------------------------------
    // Step 2: Spotify import (music/DJ) OR basic info (other categories)
    // -------------------------------------------------------------------
    ...(isMusicOrDJ
      ? [
          {
            id: "spotify",
            title: "Importa tu perfil de Spotify",
            description:
              "Rellenamos tu bio, géneros y caché orientativo automáticamente. Puedes editarlo todo después.",
            content: (
              <div className="flex flex-col gap-6">
                <SpotifyImporter onImport={handleSpotifyImport} />

                {/* Hidden fields to carry Spotify metadata into final submit */}
                {spotifyData && (
                  <>
                    <input
                      type="hidden"
                      name="spotifyArtistId"
                      value={spotifyData.artist.id}
                    />
                    <input
                      type="hidden"
                      name="spotifyFollowers"
                      value={spotifyData.artist.followers}
                    />
                    {spotifyData.artist.topTrackId && (
                      <input
                        type="hidden"
                        name="spotifyTopTrackId"
                        value={spotifyData.artist.topTrackId}
                      />
                    )}
                  </>
                )}

                <p className="text-xs text-paper-mute">
                  ¿No tienes Spotify o prefieres rellenarlo a mano?{" "}
                  <button
                    type="button"
                    className="text-accent underline-offset-4 hover:underline"
                    onClick={() => {
                      // Mark as skipped so the stepper can advance
                      setSpotifyData(null);
                    }}
                  >
                    Saltar este paso
                  </button>
                </p>
              </div>
            ),
          },
        ]
      : []),

    // -------------------------------------------------------------------
    // Step 3: Basics (name, format, city)
    // -------------------------------------------------------------------
    {
      id: "basics",
      title: "Datos básicos",
      description: "Así aparecerás en el buscador de promotoras.",
      content: (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="stageName"
            label="Nombre artístico"
            required
            error={state?.fieldErrors?.stageName}
          >
            <Input
              name="stageName"
              autoComplete="nickname"
              placeholder="Ej. Rosalía Indie"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </Field>
          <Field
            id="formatType"
            label="Formato"
            required
            error={state?.fieldErrors?.formatType}
            hint="Elige el formato que mejor describe tu actuación."
          >
            <select
              name="formatType"
              defaultValue="SOLISTA"
              className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
            >
              <option value="SOLISTA">Solista</option>
              <option value="DUO">Dúo</option>
              <option value="TRIO">Trío</option>
              <option value="GRUPO">Grupo (3-10 pax)</option>
              <option value="COMPANIA">Compañía (+10 pax)</option>
            </select>
          </Field>
          <Field
            id="baseCity"
            label="Ciudad base"
            required
            error={state?.fieldErrors?.baseCity}
            className="sm:col-span-2"
          >
            <Input
              name="baseCity"
              autoComplete="address-level2"
              placeholder="Madrid"
            />
          </Field>
          <p className="text-xs text-paper-mute sm:col-span-2">
            Cuenta asociada: {defaultEmail}
          </p>
        </div>
      ),
    },

    // -------------------------------------------------------------------
    // Step 4: Genres
    // -------------------------------------------------------------------
    {
      id: "genres",
      title: "Géneros musicales",
      description: "Elige hasta 8. Las promotoras filtran por esto.",
      content: (
        <div>
          <GenrePicker
            name="genres"
            options={GENRES}
            max={8}
            describedBy="genres-error"
            value={selectedGenres}
            onChange={setSelectedGenres}
          />
          {state?.fieldErrors?.genres && (
            <p
              id="genres-error"
              role="alert"
              className="mt-3 text-sm font-semibold text-danger"
            >
              {state.fieldErrors.genres}
            </p>
          )}
          {selectedGenres.length > 0 && spotifyData && (
            <p className="mt-3 text-xs text-paper-dim">
              Pre-seleccionados desde tu Spotify. Edítalos libremente.
            </p>
          )}
        </div>
      ),
    },

    // -------------------------------------------------------------------
    // Step 5: Bio
    // -------------------------------------------------------------------
    {
      id: "bio",
      title: "Tu bio artística",
      description: isMusicOrDJ
        ? "Hemos buscado información sobre ti. Revísala y edítala a tu gusto."
        : "Cuéntales a las promotoras quién eres. 80 caracteres son suficientes para empezar.",
      content: (
        <div className="flex flex-col gap-3">
          {spotifyData?.bio && (
            <div className="flex items-start gap-2 rounded-xl bg-graphite-soft px-4 py-3 text-xs text-paper-dim ring-1 ring-graphite-line">
              <Music2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
              <span>
                Bio obtenida automáticamente · puedes editarla o reemplazarla
              </span>
            </div>
          )}
          <Field
            id="bio"
            label="Bio artística"
            hint={
              bioLen < BIO_MIN
                ? `Mínimo recomendado: ${BIO_MIN} caracteres para subir tu puntuación de perfil`
                : "¡Suficiente para destacar!"
            }
            error={state?.fieldErrors?.bio}
          >
            <textarea
              id="bio"
              name="bio"
              rows={5}
              maxLength={BIO_MAX}
              value={bio}
              placeholder="Cuéntanos quién eres, qué tipo de shows haces y qué hace especial tu directo."
              onChange={(e) => {
                setBio(e.target.value);
                setBioLen(e.target.value.length);
              }}
              className="w-full rounded-xl border border-graphite-line bg-graphite-soft px-4 py-3 text-paper placeholder:text-paper-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite resize-none"
            />
          </Field>
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                bioLen > 0 && bioLen < BIO_MIN ? "text-accent" : "text-paper-mute"
              }
            >
              {bioLen > 0 &&
                bioLen < BIO_MIN &&
                `Faltan ${BIO_MIN - bioLen} caracteres para el mínimo recomendado`}
            </span>
            <span
              className={
                bioLen > BIO_MAX * 0.9 ? "text-danger" : "text-paper-mute"
              }
            >
              {bioLen} / {BIO_MAX}
            </span>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------
    // Step 6: Links, cache, publish
    // -------------------------------------------------------------------
    {
      id: "extras",
      title: "Links y caché (opcional)",
      description:
        "Añade tus redes y un caché orientativo para aparecer en más búsquedas.",
      content: (
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Spotify URL — pre-filled if imported */}
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
              defaultValue={
                spotifyData ? spotifyData.artist.externalUrl : undefined
              }
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
          <Field
            id="tikTokUrl"
            label="TikTok"
            hint="https://tiktok.com/@tunombre"
            error={state?.fieldErrors?.tikTokUrl}
          >
            <Input
              name="tikTokUrl"
              type="url"
              placeholder="https://tiktok.com/@tunombre"
              autoComplete="off"
            />
          </Field>

          {/* Cache */}
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm text-paper-dim">
              Caché orientativo — ayuda a las promotoras a filtrar por presupuesto.
            </p>
            {spotifyData && (spotifyData.cacheMin || spotifyData.cacheMax) && (
              <p className="mb-3 text-xs text-accent">
                💡 Sugerencia basada en tus{" "}
                {spotifyData.artist.followers.toLocaleString("es-ES")} seguidores
                de Spotify: {spotifyData.cacheMin?.toLocaleString("es-ES")}–
                {spotifyData.cacheMax?.toLocaleString("es-ES")} €. Puedes
                cambiarlo.
              </p>
            )}
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
                  value={cacheMin}
                  onChange={(e) => setCacheMin(e.target.value)}
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
                  value={cacheMax}
                  onChange={(e) => setCacheMax(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <input type="hidden" name="currency" value="EUR" />

          <div className="sm:col-span-2 flex flex-col gap-4 border-t border-graphite-line pt-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="cachePublic"
                defaultChecked
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <div>
                <p className="text-sm font-semibold text-paper">
                  Mostrar caché a promotoras
                </p>
                <p className="text-xs text-paper-dim">
                  Si lo desactivas aparecerá «Caché bajo consulta» en tu perfil.
                  El filtro de presupuesto sigue funcionando internamente.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="published"
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <div>
                <p className="text-sm font-semibold text-paper">
                  Publicar perfil al finalizar
                </p>
                <p className="text-xs text-paper-dim">
                  Las promotoras podrán encontrarte en el buscador. También
                  puedes activarlo después desde el dashboard.
                </p>
              </div>
            </label>
          </div>
        </div>
      ),
    },
  ];

  return (
    <form action={formAction} noValidate>
      <Stepper
        pending={pending}
        submitLabel="Completar onboarding"
        steps={steps}
      />
      {state?.error && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-danger/15 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
