import type { ArtistProfile } from "@prisma/client";

type CompletenessInput = Pick<
  ArtistProfile,
  | "bio"
  | "baseCity"
  | "genres"
  | "cacheMin"
  | "cacheMax"
  | "spotifyUrl"
  | "youtubeUrl"
  | "instagramUrl"
  | "soundcloudUrl"
> & {
  mediaCount: number;
  ridersCount: number;
};

export function computeCompleteness(input: CompletenessInput): number {
  let score = 0;
  if (input.bio && input.bio.trim().length >= 80) score += 20;
  if (input.baseCity) score += 5;
  if (input.genres.length > 0) score += 10;
  if (input.cacheMin && input.cacheMax) score += 15;
  const links = [
    input.spotifyUrl,
    input.youtubeUrl,
    input.instagramUrl,
    input.soundcloudUrl,
  ].filter(Boolean).length;
  score += Math.min(links, 3) * 5;
  if (input.mediaCount >= 1) score += 10;
  if (input.mediaCount >= 3) score += 10;
  if (input.ridersCount >= 1) score += 15;
  return Math.min(100, score);
}

export function formatCacheRange(min?: number | null, max?: number | null, currency = "EUR") {
  if (!min && !max) return "Por definir";
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}
