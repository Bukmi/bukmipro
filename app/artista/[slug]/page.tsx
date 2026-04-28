import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instagram, Youtube, Music2, Link as LinkIcon, MapPin, Star } from "lucide-react";
import { formatCacheRange } from "@/lib/artist";
import { getPublicArtistBySlug } from "@/lib/queries";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TrackView } from "@/components/public/track-view";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  // Uses React cache — no extra DB round-trip when page component calls it too
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

function formatLabel(f: string) {
  return f === "SOLO" ? "Solo / Cantautor" : f === "BAND" ? "Banda" : "DJ";
}

export default async function ArtistPublicPage({ params }: { params: Params }) {
  const { slug } = await params;
  // React cache deduplicates — generateMetadata already ran this query
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

  const socials = [
    { href: artist.spotifyUrl, label: "Spotify", Icon: Music2 },
    { href: artist.youtubeUrl, label: "YouTube", Icon: Youtube },
    { href: artist.instagramUrl, label: "Instagram", Icon: Instagram },
    { href: artist.soundcloudUrl, label: "SoundCloud", Icon: LinkIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof Music2 } => !!s.href);

  return (
    <>
      <SiteHeader />
      <TrackView slug={artist.slug} />
      <main id="main" className="container-hero py-12">
        <article className="flex flex-col gap-12">
          <header className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              {formatLabel(artist.formatType)}
            </p>
            <h1 className="text-display">{artist.stageName}</h1>
            <div className="flex flex-wrap gap-6 text-sm text-paper-dim">
              {artist.baseCity && (
                <span className="flex items-center gap-2">
                  <MapPin aria-hidden className="h-4 w-4" /> {artist.baseCity}
                </span>
              )}
              <span>
                Caché:{" "}
                {artist.cachePublic === false
                  ? "no disponible"
                  : formatCacheRange(artist.cacheMin, artist.cacheMax, artist.currency)}
              </span>
              <span>Radio: {artist.radiusKm ?? "—"} km</span>
              {avgRating !== null && (
                <span className="flex items-center gap-1" aria-label={`Media ${avgRating} sobre 5`}>
                  <Star aria-hidden className="h-4 w-4 fill-accent text-accent" />
                  <strong className="text-paper">{avgRating}</strong>
                  <span>({reviews.length})</span>
                </span>
              )}
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

          {artist.bio && (
            <section aria-labelledby="about">
              <h2 id="about" className="sr-only">Sobre el artista</h2>
              <p className="max-w-2xl whitespace-pre-line text-lg text-paper/90">{artist.bio}</p>
            </section>
          )}

          {photos.length > 0 && (
            <section aria-labelledby="photos">
              <h2 id="photos" className="text-hero mb-6">Fotos</h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {photos.map((p) => (
                  <li key={p.id} className="relative aspect-square overflow-hidden rounded-2xl bg-graphite-soft">
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

          {videos.length > 0 && (
            <section aria-labelledby="videos">
              <h2 id="videos" className="text-hero mb-6">Videos</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {videos.map((v) => (
                  <li key={v.id} className="overflow-hidden rounded-2xl bg-graphite-soft">
                    <video src={v.url} controls className="w-full" aria-label={v.caption ?? `Video de ${artist.stageName}`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tracks.length > 0 && (
            <section aria-labelledby="tracks">
              <h2 id="tracks" className="text-hero mb-6">Tracks</h2>
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

          {reviews.length > 0 && (
            <section aria-labelledby="reviews">
              <h2 id="reviews" className="text-hero mb-6">Valoraciones de promotoras</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line">
                    <p className="text-sm font-bold text-accent" aria-label={`${r.rating} sobre 5`}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </p>
                    {r.body && <p className="text-sm text-paper/90">{r.body}</p>}
                    <footer className="text-xs text-paper-mute">
                      {r.promoter} · {r.venueName}, {r.eventCity} ·
                      {" "}{new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(r.eventDate)}
                    </footer>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {socials.length > 0 && (
            <section aria-labelledby="socials">
              <h2 id="socials" className="text-hero mb-6">En otras plataformas</h2>
              <ul className="flex flex-wrap gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener"
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
