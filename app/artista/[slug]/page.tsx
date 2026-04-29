import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Instagram,
  Youtube,
  Music2,
  Link as LinkIcon,
  MapPin,
  Star,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { formatCacheRange } from "@/lib/artist";
import { getPublicArtistBySlug } from "@/lib/queries";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TrackView } from "@/components/public/track-view";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);
  if (!artist || !artist.published) return { title: "Artista" };
  const description =
    artist.bio?.slice(0, 200) ??
    `${artist.stageName} · ${artist.baseCity ?? "España"} · ${artist.genres.slice(0, 3).join(", ")}`;
  const cover = artist.media.find((m) => m.kind === "PHOTO")?.url;
  return {
    title: artist.stageName,
    description,
    alternates: { canonical: `/artista/${artist.slug}` },
    openGraph: {
      title: `${artist.stageName} · Bukmi`,
      description,
      url: `/artista/${artist.slug}`,
      type: "profile",
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: artist.stageName,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

const FORMAT_LABEL: Record<string, string> = {
  SOLISTA: "Solista",
  DUO: "Dúo",
  TRIO: "Trío",
  GRUPO: "Grupo (3-10 pax)",
  COMPANIA: "Compañía (+10 pax)",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString("es-ES");
}

export default async function ArtistPublicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);
  if (!artist || !artist.published) notFound();

  const reviews = artist.proposals
    .map((b) => {
      const r = b.reviews[0];
      return r
        ? {
            id: r.id,
            rating: r.rating,
            body: r.body,
            promoter: b.promoter.companyName,
            eventDate: b.eventDate,
            eventCity: b.eventCity,
            venueName: b.venueName,
          }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const avgRating =
    reviews.length === 0
      ? null
      : Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10;

  const photos = artist.media.filter((m) => m.kind === "PHOTO");
  const tracks = artist.media.filter((m) => m.kind === "TRACK");
  const videos = artist.media.filter((m) => m.kind === "VIDEO");
  const coverPhoto = photos[0];

  // Build social links
  type Social = { href: string; label: string; Icon: typeof Music2 };
  const socials: Social[] = (
    [
      { href: artist.spotifyUrl, label: "Spotify", Icon: Music2 },
      { href: artist.youtubeUrl, label: "YouTube", Icon: Youtube },
      { href: artist.instagramUrl, label: "Instagram", Icon: Instagram },
      { href: (artist as { soundcloudUrl?: string | null }).soundcloudUrl, label: "SoundCloud", Icon: LinkIcon },
      { href: (artist as { tikTokUrl?: string | null }).tikTokUrl, label: "TikTok", Icon: LinkIcon },
      { href: (artist as { bandsintownUrl?: string | null }).bandsintownUrl, label: "Bandsintown", Icon: LinkIcon },
    ] as Array<{ href: string | null | undefined; label: string; Icon: typeof Music2 }>
  ).filter((s): s is Social => !!s.href);

  // Metrics row items
  type Metric = { label: string; value: string; Icon: typeof Users };
  const metrics: Metric[] = [];

  const spotifyFollowers = (artist as { spotifyFollowers?: number | null }).spotifyFollowers;
  const instagramFollowers = (artist as { instagramFollowers?: number | null }).instagramFollowers;

  if (spotifyFollowers) {
    metrics.push({ label: "Spotify", value: formatNumber(spotifyFollowers), Icon: Music2 });
  }
  if (instagramFollowers) {
    metrics.push({ label: "Instagram", value: formatNumber(instagramFollowers), Icon: Instagram });
  }

  const cacheLabel =
    artist.cachePublic === false
      ? "Caché bajo consulta"
      : formatCacheRange(artist.cacheMin, artist.cacheMax, artist.currency);

  if (artist.cacheMin || artist.cacheMax) {
    metrics.push({ label: cacheLabel, value: "", Icon: CircleDollarSign });
  }

  // Spotify top track embed
  const topTrackId = (artist as { spotifyTopTrackId?: string | null }).spotifyTopTrackId;

  return (
    <>
      <SiteHeader />
      <TrackView slug={artist.slug} />
      <main id="main" className="container-hero py-12">
        <article className="flex flex-col gap-12">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <header className="flex flex-col gap-6">
            <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:gap-8">
              {/* Text */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  {FORMAT_LABEL[artist.formatType] ?? artist.formatType}
                </p>
                <h1 className="text-display">{artist.stageName}</h1>

                {/* Location + rating */}
                <div className="flex flex-wrap gap-4 text-sm text-paper-dim">
                  {artist.baseCity && (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="h-4 w-4" />
                      {artist.baseCity}
                      {artist.radiusKm ? ` · hasta ${artist.radiusKm} km` : ""}
                    </span>
                  )}
                  {avgRating !== null && (
                    <span
                      className="flex items-center gap-1"
                      aria-label={`Media ${avgRating} sobre 5`}
                    >
                      <Star aria-hidden className="h-4 w-4 fill-accent text-accent" />
                      <strong className="text-paper">{avgRating}</strong>
                      <span>({reviews.length})</span>
                    </span>
                  )}
                </div>

                {/* Genres */}
                {artist.genres.length > 0 && (
                  <ul aria-label="Géneros" className="flex flex-wrap gap-2">
                    {artist.genres.map((g) => (
                      <li
                        key={g}
                        className="rounded-full border border-graphite-line px-3 py-1 text-xs font-semibold text-paper-dim"
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cover photo */}
              {coverPhoto && (
                <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-graphite-soft sm:h-48 sm:w-48">
                  <Image
                    src={coverPhoto.url}
                    alt={`${artist.stageName} — foto`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 160px, 192px"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Metrics bar */}
            {metrics.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-2 rounded-full bg-graphite-soft px-4 py-2 text-sm ring-1 ring-graphite-line"
                  >
                    <m.Icon aria-hidden className="h-4 w-4 text-accent" />
                    {m.value ? (
                      <>
                        <span className="font-bold text-paper">{m.value}</span>
                        <span className="text-paper-dim">{m.label}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-paper">{m.label}</span>
                    )}
                  </div>
                ))}
                {/* Cache chip if no spotify/ig followers shown */}
                {metrics.length === 0 && (artist.cacheMin || artist.cacheMax) && (
                  <div className="flex items-center gap-2 rounded-full bg-graphite-soft px-4 py-2 text-sm ring-1 ring-graphite-line">
                    <CircleDollarSign aria-hidden className="h-4 w-4 text-accent" />
                    <span className="font-semibold text-paper">{cacheLabel}</span>
                  </div>
                )}
              </div>
            )}
          </header>

          {/* ── Spotify top-track embed ──────────────────────────────── */}
          {topTrackId && (
            <section aria-labelledby="spotify-embed">
              <h2 id="spotify-embed" className="text-hero mb-4">
                Escúchalo en Spotify
              </h2>
              <div className="overflow-hidden rounded-2xl">
                <iframe
                  src={`https://open.spotify.com/embed/track/${topTrackId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`Escuchar ${artist.stageName} en Spotify`}
                  className="border-0"
                />
              </div>
            </section>
          )}

          {/* ── Bio ─────────────────────────────────────────────────── */}
          {artist.bio && (
            <section aria-labelledby="about">
              <h2 id="about" className="sr-only">Sobre el artista</h2>
              <p className="max-w-2xl whitespace-pre-line text-lg text-paper/90 leading-relaxed">
                {artist.bio}
              </p>
            </section>
          )}

          {/* ── Photo gallery ───────────────────────────────────────── */}
          {photos.length > 1 && (
            <section aria-labelledby="photos">
              <h2 id="photos" className="text-hero mb-6">Fotos</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {photos.map((p) => (
                  <li
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-graphite-soft"
                  >
                    <Image
                      src={p.url}
                      alt={p.caption ?? `${artist.stageName} — foto`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Videos ──────────────────────────────────────────────── */}
          {videos.length > 0 && (
            <section aria-labelledby="videos">
              <h2 id="videos" className="text-hero mb-6">Videos</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {videos.map((v) => (
                  <li key={v.id} className="overflow-hidden rounded-2xl bg-graphite-soft">
                    <video
                      src={v.url}
                      controls
                      className="w-full"
                      aria-label={v.caption ?? `Video de ${artist.stageName}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Audio tracks ────────────────────────────────────────── */}
          {tracks.length > 0 && (
            <section aria-labelledby="tracks">
              <h2 id="tracks" className="text-hero mb-6">Tracks</h2>
              <ul className="flex flex-col gap-3">
                {tracks.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line"
                  >
                    <p className="mb-2 text-sm font-semibold">{t.caption ?? "Track"}</p>
                    <audio src={t.url} controls className="w-full" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Reviews ─────────────────────────────────────────────── */}
          {reviews.length > 0 && (
            <section aria-labelledby="reviews">
              <h2 id="reviews" className="text-hero mb-6">
                Valoraciones de promotoras
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-2 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
                  >
                    <p
                      className="text-sm font-bold text-accent"
                      aria-label={`${r.rating} sobre 5`}
                    >
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </p>
                    {r.body && <p className="text-sm text-paper/90">{r.body}</p>}
                    <footer className="text-xs text-paper-mute">
                      {r.promoter} · {r.venueName}, {r.eventCity} ·{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(r.eventDate)}
                    </footer>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Rider note ──────────────────────────────────────────── */}
          {artist.riders.length > 0 && (
            <section>
              <div className="flex items-center gap-3 rounded-2xl bg-graphite-soft px-5 py-4 ring-1 ring-graphite-line">
                <LinkIcon aria-hidden className="h-5 w-5 text-accent shrink-0" />
                <p className="text-sm text-paper-dim">
                  Este artista tiene rider técnico disponible. Solicítalo al enviar una propuesta.
                </p>
              </div>
            </section>
          )}

          {/* ── Social links ────────────────────────────────────────── */}
          {socials.length > 0 && (
            <section aria-labelledby="socials">
              <h2 id="socials" className="text-hero mb-4">Plataformas</h2>
              <ul className="flex flex-wrap gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-graphite-line px-4 py-2 text-sm font-semibold text-paper hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
