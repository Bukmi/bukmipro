import { GENRES } from "@/app/(app)/onboarding/genres";

export function genreSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const GENRE_SLUGS: Array<{ name: (typeof GENRES)[number]; slug: string }> =
  GENRES.map((name) => ({ name, slug: genreSlug(name) }));

export function findGenreBySlug(slug: string) {
  return GENRE_SLUGS.find((g) => g.slug === slug.toLowerCase());
}
