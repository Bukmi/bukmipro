export const PERFORMANCE_CATEGORIES = [
  { value: "LIVE_MUSIC",       label: "Música en vivo",     slug: "musica-en-vivo",   emoji: "🎵" },
  { value: "DJ",               label: "DJs",                slug: "djs",              emoji: "🎧" },
  { value: "COMEDY",           label: "Comedia",            slug: "comedia",          emoji: "🎤" },
  { value: "MAGIC",            label: "Magia",              slug: "magia",            emoji: "✨" },
  { value: "ACTING",           label: "Acting",             slug: "acting",           emoji: "🎭" },
  { value: "DANCE_ACROBATICS", label: "Baile y Acrobacias", slug: "baile-acrobacias", emoji: "💃" },
  { value: "KIDS",             label: "Infantil",           slug: "infantil",         emoji: "🎪" },
] as const;

export type PerformanceCategoryValue =
  (typeof PERFORMANCE_CATEGORIES)[number]["value"];

/** Sub-estilos que aparecen como pills contextuales bajo cada categoría */
export const CATEGORY_SUBGENRES: Record<PerformanceCategoryValue, Array<{ label: string; genreSlug?: string }>> = {
  LIVE_MUSIC: [
    { label: "Indie",     genreSlug: "indie" },
    { label: "Rock",      genreSlug: "rock" },
    { label: "Pop",       genreSlug: "pop" },
    { label: "Flamenco",  genreSlug: "flamenco" },
    { label: "Folk",      genreSlug: "folk" },
    { label: "Jazz",      genreSlug: "jazz" },
    { label: "Versiones" },
    { label: "Clásico" },
    { label: "Metal" },
  ],
  DJ: [
    { label: "Electrónica", genreSlug: "electronica" },
    { label: "House" },
    { label: "Techno" },
    { label: "Reggaetón",   genreSlug: "latin" },
    { label: "Hip-Hop",     genreSlug: "hip-hop" },
    { label: "R&B",         genreSlug: "r-b" },
    { label: "Comercial" },
  ],
  COMEDY: [
    { label: "Stand-up" },
    { label: "Monólogos" },
    { label: "Humor musical" },
    { label: "Improvisación" },
    { label: "Magia cómica" },
  ],
  MAGIC: [
    { label: "Magia de salón" },
    { label: "Mentalismo" },
    { label: "Ilusionismo" },
    { label: "Close-up" },
    { label: "Gran ilusión" },
  ],
  ACTING: [
    { label: "Teatro" },
    { label: "Cabaret" },
    { label: "Performance" },
    { label: "Spoken word" },
    { label: "Monólogo teatral" },
  ],
  DANCE_ACROBATICS: [
    { label: "Flamenco",     genreSlug: "flamenco" },
    { label: "Ballet" },
    { label: "Contemporáneo" },
    { label: "Acrobacia" },
    { label: "Breakdance" },
    { label: "Danza urbana" },
  ],
  KIDS: [
    { label: "Teatro infantil" },
    { label: "Magia infantil" },
    { label: "Payasos" },
    { label: "Cuentacuentos" },
    { label: "Títeres" },
  ],
};

export function categoryFromSlug(slug: string): PerformanceCategoryValue | null {
  return PERFORMANCE_CATEGORIES.find((c) => c.slug === slug)?.value ?? null;
}

export function categoryLabel(value: PerformanceCategoryValue): string {
  return PERFORMANCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
