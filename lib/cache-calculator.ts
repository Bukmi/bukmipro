/**
 * Cache (fee) suggestion based on Spotify follower count.
 * These are market-based reference ranges for Spain/Europe.
 */

export type CacheSuggestion = {
  min: number;
  max: number;
  label: string; // human-readable explanation
};

const TIERS: Array<{
  maxFollowers: number;
  min: number;
  max: number;
  label: string;
}> = [
  {
    maxFollowers: 1_000,
    min: 200,
    max: 500,
    label: "artista emergente (< 1K seguidores en Spotify)",
  },
  {
    maxFollowers: 5_000,
    min: 400,
    max: 1_200,
    label: "artista en crecimiento (1K–5K seguidores)",
  },
  {
    maxFollowers: 20_000,
    min: 800,
    max: 2_500,
    label: "artista consolidado (5K–20K seguidores)",
  },
  {
    maxFollowers: 100_000,
    min: 1_500,
    max: 6_000,
    label: "artista reconocido (20K–100K seguidores)",
  },
  {
    maxFollowers: 500_000,
    min: 3_000,
    max: 20_000,
    label: "artista popular (100K–500K seguidores)",
  },
  {
    maxFollowers: Infinity,
    min: 10_000,
    max: 50_000,
    label: "artista de alto perfil (500K+ seguidores)",
  },
];

/**
 * Returns a suggested cache range based on Spotify follower count.
 * Returns null if followers is 0 or not provided.
 */
export function suggestCache(followers: number | null | undefined): CacheSuggestion | null {
  if (!followers || followers <= 0) return null;

  const tier = TIERS.find((t) => followers <= t.maxFollowers);
  if (!tier) return null;

  return {
    min: tier.min,
    max: tier.max,
    label: tier.label,
  };
}

/**
 * Formats a cache suggestion as a human-readable string.
 * e.g. "800–2.500 €"
 */
export function formatCacheRange(
  suggestion: CacheSuggestion,
  currency = "EUR"
): string {
  const symbol = currency === "EUR" ? "€" : currency;
  const fmt = (n: number) => n.toLocaleString("es-ES");
  return `${fmt(suggestion.min)}–${fmt(suggestion.max)} ${symbol}`;
}
