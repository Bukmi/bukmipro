import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchFiltersSchema } from "@/lib/validation";
import { GENRES } from "@/app/(app)/onboarding/genres";
import { ArtistCard } from "@/components/public/artist-card";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Artistas · Bukmi",
  description:
    "Descubre artistas en directo verificados en España: bandas, DJs y solistas con disponibilidad real, caché orientativo y contratación directa.",
  alternates: { canonical: "/artistas" },
  openGraph: {
    title: "Artistas en directo · Bukmi",
    description:
      "Directorio de artistas profesionales con disponibilidad real y contratación directa.",
    url: "/artistas",
    type: "website",
  },
};

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ArtistsDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = searchFiltersSchema.safeParse(sp);
  const filters = parsed.success ? parsed.data : {};

  const artists = await prisma.artistProfile.findMany({
    where: {
      published: true,
      ...(filters.formatType ? { formatType: filters.formatType } : {}),
      ...(filters.city
        ? { baseCity: { contains: filters.city, mode: "insensitive" as const } }
        : {}),
      ...(filters.genre ? { genres: { has: filters.genre } } : {}),
      ...(filters.q
        ? {
            OR: [
              { stageName: { contains: filters.q, mode: "insensitive" as const } },
              { bio: { contains: filters.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(filters.maxCache ? { cacheMin: { lte: filters.maxCache } } : {}),
    },
    include: {
      media: { where: { kind: "PHOTO" }, take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ completenessScore: "desc" }, { updatedAt: "desc" }],
    take: 60,
  });

  return (
    <>
      <SiteHeader />
      <main id="main" className="container-hero flex flex-col gap-10 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Directorio</p>
          <h1 className="text-display max-w-3xl">
            Artistas en directo <span className="text-accent">en España</span>.
          </h1>
          <p className="max-w-2xl text-lg text-paper-dim">
            {artists.length} {artists.length === 1 ? "artista disponible" : "artistas disponibles"}
            . Filtra por ciudad, género o formato y abre su perfil para ver
            disponibilidad real y caché orientativo.
          </p>
        </header>

        <form
          method="get"
          action="/artistas"
          className="grid gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line sm:grid-cols-2 lg:grid-cols-5"
          role="search"
          aria-label="Filtrar artistas"
        >
          <Field id="q" label="Buscar">
            <Input name="q" defaultValue={filters.q ?? ""} placeholder="Nombre o bio" />
          </Field>
          <Field id="city" label="Ciudad">
            <Input name="city" defaultValue={filters.city ?? ""} placeholder="Madrid" />
          </Field>
          <Field id="genre" label="Género">
            <select
              id="genre"
              name="genre"
              defaultValue={filters.genre ?? ""}
              className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
            >
              <option value="">Cualquiera</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field id="formatType" label="Formato">
            <select
              id="formatType"
              name="formatType"
              defaultValue={filters.formatType ?? ""}
              className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
            >
              <option value="">Cualquiera</option>
              <option value="SOLO">Solo / Cantautor</option>
              <option value="BAND">Banda</option>
              <option value="DJ">DJ</option>
            </select>
          </Field>
          <Field id="maxCache" label="Caché máx. (€)">
            <Input
              name="maxCache"
              type="number"
              min={0}
              defaultValue={filters.maxCache ?? ""}
              placeholder="1500"
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm">
              Aplicar filtros
            </Button>
            <Link
              href="/artistas"
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Limpiar
            </Link>
            <span className="ml-auto text-xs text-paper-mute">
              ¿Eres promotora?{" "}
              <Link href="/signup?role=PROMOTER" className="text-accent underline">
                Crea una cuenta
              </Link>{" "}
              para contactar directamente.
            </span>
          </div>
        </form>

        {artists.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-graphite-line p-12 text-center text-paper-mute">
            No hemos encontrado artistas con esos filtros. Prueba a ampliar los criterios.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <li key={a.id}>
                <ArtistCard
                  artist={{
                    slug: a.slug,
                    stageName: a.stageName,
                    formatType: a.formatType,
                    baseCity: a.baseCity,
                    genres: a.genres,
                    cacheMin: a.cacheMin,
                    cacheMax: a.cacheMax,
                    currency: a.currency,
                    completenessScore: a.completenessScore,
                    coverUrl: a.media[0]?.url ?? null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        <aside
          aria-labelledby="genres-index"
          className="rounded-2xl border border-graphite-line p-6"
        >
          <h2 id="genres-index" className="text-lg font-extrabold">
            Explora por género
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <li key={g}>
                <Link
                  href={`/generos/${encodeURIComponent(g.toLowerCase())}`}
                  className="inline-flex items-center rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-dim hover:border-accent hover:text-accent"
                >
                  {g}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
