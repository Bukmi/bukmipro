import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/session";
import { formatCacheRange } from "@/lib/artist";
import { ProposalForm } from "@/components/app/proposal-form";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const artist = await prisma.artistProfile.findUnique({ where: { slug } });
  return { title: artist?.stageName ?? "Artista" };
}

export default async function ArtistDetailForPromoter({ params }: { params: Params }) {
  const { promoter } = await requirePromoter();
  const { slug } = await params;
  const artist = await prisma.artistProfile.findUnique({
    where: { slug },
    include: {
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 8 },
      availability: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  });
  if (!artist || !artist.published) notFound();

  const photos = artist.media.filter((m) => m.kind === "PHOTO");
  const tracks = artist.media.filter((m) => m.kind === "TRACK");

  return (
    <section className="flex flex-col gap-10">
      <Link
        href="/dashboard/buscar"
        className="inline-flex w-fit items-center gap-1 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" /> Volver al buscador
      </Link>

      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">
          {artist.formatType === "SOLO" ? "Solo / Cantautor" : artist.formatType === "BAND" ? "Banda" : "DJ"}
        </p>
        <h1 className="text-hero">{artist.stageName}</h1>
        <div className="flex flex-wrap gap-5 text-sm text-paper-dim">
          {artist.baseCity && (
            <span className="flex items-center gap-2">
              <MapPin aria-hidden className="h-4 w-4" /> {artist.baseCity}
            </span>
          )}
          <span>Caché: {formatCacheRange(artist.cacheMin, artist.cacheMax, artist.currency)}</span>
          <span>Completitud: {artist.completenessScore}%</span>
        </div>
        {artist.genres.length > 0 && (
          <ul aria-label="Géneros" className="flex flex-wrap gap-2">
            {artist.genres.map((g) => (
              <li key={g} className="rounded-full border border-graphite-line px-3 py-1 text-xs font-semibold text-paper-dim">
                {g}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {artist.bio && (
            <section aria-labelledby="bio-heading">
              <h2 id="bio-heading" className="sr-only">Sobre el artista</h2>
              <p className="whitespace-pre-line text-base text-paper/90">{artist.bio}</p>
            </section>
          )}

          {photos.length > 0 && (
            <section aria-labelledby="photos-heading">
              <h2 id="photos-heading" className="mb-4 text-base font-extrabold">Fotos</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {photos.slice(0, 6).map((p) => (
                  <li key={p.id} className="overflow-hidden rounded-2xl bg-graphite-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? `${artist.stageName}`} className="aspect-square w-full object-cover" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tracks.length > 0 && (
            <section aria-labelledby="tracks-heading">
              <h2 id="tracks-heading" className="mb-4 text-base font-extrabold">Tracks</h2>
              <ul className="flex flex-col gap-3">
                {tracks.map((t) => (
                  <li key={t.id} className="rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line">
                    <p className="mb-2 text-sm font-semibold">{t.caption ?? "Track"}</p>
                    <audio src={t.url} controls className="w-full" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-labelledby="proposal-heading" className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <h2 id="proposal-heading" className="text-base font-extrabold">Enviar propuesta</h2>
          <ProposalForm
            artistProfileId={artist.id}
            artistName={artist.stageName}
            venues={promoter.venues}
            defaultCurrency={artist.currency}
          />
        </aside>
      </div>
    </section>
  );
}
