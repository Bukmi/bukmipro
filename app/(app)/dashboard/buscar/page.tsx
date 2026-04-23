import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/session";
import { formatCacheRange } from "@/lib/artist";
import { GENRES } from "@/app/(app)/onboarding/genres";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { searchFiltersSchema } from "@/lib/validation";

export const metadata = { title: "Buscar artistas" };

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function BuscarPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePromoter();
  const sp = await searchParams;
  const parsed = searchFiltersSchema.safeParse(sp);
  const filters = parsed.success ? parsed.data : {};

  const availableOnDate = filters.availableOn
    ? new Date(`${filters.availableOn}T00:00:00.000Z`)
    : null;

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
      ...(availableOnDate
        ? {
            NOT: {
              availability: {
                some: {
                  date: availableOnDate,
                  status: { in: ["BLOCKED", "BOOKED", "TENTATIVE"] as const },
                },
              },
            },
          }
        : {}),
    },
    include: { media: { where: { kind: "PHOTO" }, take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ completenessScore: "desc" }, { updatedAt: "desc" }],
    take: 60,
  });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Buscador</p>
        <h1 className="text-hero">Artistas disponibles</h1>
        <p className="text-paper-dim">
          {artists.length} {artists.length === 1 ? "artista" : "artistas"} coinciden
          con tus filtros. Ordenados por completitud del perfil.
        </p>
      </header>

      <form
        method="get"
        action="/dashboard/buscar"
        className="grid gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line sm:grid-cols-2 lg:grid-cols-6"
        role="search"
        aria-label="Filtros de búsqueda"
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
              <option key={g} value={g}>{g}</option>
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
          <Input name="maxCache" type="number" min={0} defaultValue={filters.maxCache ?? ""} placeholder="1500" />
        </Field>
        <Field id="availableOn" label="Disponible el">
          <Input name="availableOn" type="date" defaultValue={filters.availableOn ?? ""} />
        </Field>
        <div className="sm:col-span-2 lg:col-span-6 flex gap-2">
          <Button type="submit" size="sm">Aplicar filtros</Button>
          <Link
            href="/dashboard/buscar"
            className="inline-flex items-center rounded-xl px-3 py-2 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {artists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-graphite-line p-12 text-center text-paper-mute">
          No hemos encontrado artistas con esos filtros. Prueba a ampliar los criterios.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => {
            const cover = a.media[0]?.url;
            return (
              <li key={a.id}>
                <Link
                  href={`/dashboard/buscar/${a.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl bg-graphite-soft ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" aria-hidden className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-paper-mute">Sin foto</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-graphite/80 px-2 py-1 text-xs font-bold text-paper backdrop-blur">
                      {a.completenessScore}%
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-accent">
                      {a.formatType === "SOLO" ? "Solo" : a.formatType === "BAND" ? "Banda" : "DJ"}
                    </p>
                    <h2 className="text-lg font-extrabold">{a.stageName}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-paper-dim">
                      {a.baseCity && (
                        <span className="flex items-center gap-1">
                          <MapPin aria-hidden className="h-3 w-3" /> {a.baseCity}
                        </span>
                      )}
                      {a.genres.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users aria-hidden className="h-3 w-3" /> {a.genres.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="mt-auto text-xs font-semibold text-paper">
                      {formatCacheRange(a.cacheMin, a.cacheMax, a.currency)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
