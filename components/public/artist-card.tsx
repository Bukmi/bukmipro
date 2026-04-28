import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { formatCacheRange } from "@/lib/artist";

type ArtistCardData = {
  slug: string;
  stageName: string;
  formatType: "SOLO" | "BAND" | "DJ";
  baseCity: string | null;
  genres: string[];
  cacheMin: number | null;
  cacheMax: number | null;
  cachePublic?: boolean | null;
  currency: string;
  completenessScore: number;
  coverUrl?: string | null;
};

const FORMAT_LABEL: Record<ArtistCardData["formatType"], string> = {
  SOLO: "Solo",
  BAND: "Banda",
  DJ: "DJ",
};

export function ArtistCard({
  artist,
  href,
}: {
  artist: ArtistCardData;
  href?: string;
}) {
  const link = href ?? `/artista/${artist.slug}`;
  return (
    <Link
      href={link}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-graphite-soft ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.coverUrl}
            alt=""
            aria-hidden
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-paper-mute">
            Sin foto
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-graphite/80 px-2 py-1 text-xs font-bold text-paper backdrop-blur">
          {artist.completenessScore}%
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.15em] text-accent">
          {FORMAT_LABEL[artist.formatType]}
        </p>
        <h3 className="text-lg font-extrabold">{artist.stageName}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-paper-dim">
          {artist.baseCity && (
            <span className="flex items-center gap-1">
              <MapPin aria-hidden className="h-3 w-3" /> {artist.baseCity}
            </span>
          )}
          {artist.genres.length > 0 && (
            <span className="flex items-center gap-1">
              <Users aria-hidden className="h-3 w-3" />
              {artist.genres.slice(0, 3).join(", ")}
            </span>
          )}
        </div>
        <p className="mt-auto text-xs font-semibold text-paper">
          {artist.cachePublic === false
            ? "Caché no disponible"
            : formatCacheRange(artist.cacheMin, artist.cacheMax, artist.currency)}
        </p>
      </div>
    </Link>
  );
}
