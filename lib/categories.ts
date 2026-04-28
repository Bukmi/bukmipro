export const PERFORMANCE_CATEGORIES = [
  { value: "LIVE_MUSIC",       label: "Música en vivo",     slug: "musica-en-vivo",    emoji: "🎵" },
  { value: "DJ",               label: "DJs",                slug: "djs",               emoji: "🎧" },
  { value: "COMEDY",           label: "Comedia",            slug: "comedia",           emoji: "🎤" },
  { value: "MAGIC",            label: "Magia",              slug: "magia",             emoji: "✨" },
  { value: "ACTING",           label: "Acting",             slug: "acting",            emoji: "🎭" },
  { value: "DANCE_ACROBATICS", label: "Baile y Acrobacias", slug: "baile-acrobacias",  emoji: "💃" },
  { value: "KIDS",             label: "Infantil",           slug: "infantil",          emoji: "🎪" },
] as const;

export type PerformanceCategoryValue =
  (typeof PERFORMANCE_CATEGORIES)[number]["value"];

export function categoryFromSlug(slug: string): PerformanceCategoryValue | null {
  return PERFORMANCE_CATEGORIES.find((c) => c.slug === slug)?.value ?? null;
}

export function categoryLabel(value: PerformanceCategoryValue): string {
  return PERFORMANCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
