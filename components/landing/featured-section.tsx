"use client";

import { useState } from "react";
import Link from "next/link";
import { ArtistCard } from "@/components/public/artist-card";
import {
  PERFORMANCE_CATEGORIES,
  CATEGORY_SUBGENRES,
  type PerformanceCategoryValue,
} from "@/lib/categories";

type FeaturedArtist = {
  id: string;
  slug: string;
  stageName: string;
  formatType: "SOLO" | "BAND" | "DJ";
  category: PerformanceCategoryValue;
  baseCity: string | null;
  genres: string[];
  cacheMin: number | null;
  cacheMax: number | null;
  cachePublic: boolean | null;
  currency: string;
  completenessScore: number;
  coverUrl: string | null;
};

export function FeaturedSection({ artists }: { artists: FeaturedArtist[] }) {
  const [activeCategory, setActiveCategory] = useState<PerformanceCategoryValue | null>(null);

  const filtered = activeCategory
    ? artists.filter((a) => a.category === activeCategory)
    : artists;

  const subGenres = activeCategory ? CATEGORY_SUBGENRES[activeCategory] : [];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Tabs de primer nivel ────────────────────────────── */}
      <nav aria-label="Categorías" className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          aria-pressed={!activeCategory}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite ${
            !activeCategory
              ? "border-accent bg-accent text-accent-ink"
              : "border-graphite-line text-paper-dim hover:border-accent hover:text-accent"
          }`}
        >
          Todos
        </button>
        {PERFORMANCE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setActiveCategory(c.value)}
            aria-pressed={activeCategory === c.value}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite ${
              activeCategory === c.value
                ? "border-accent bg-accent text-accent-ink"
                : "border-graphite-line text-paper-dim hover:border-accent hover:text-accent"
            }`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </nav>

      {/* ── Grid de artistas ────────────────────────────────── */}
      {filtered.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 6).map((a) => (
            <li key={a.id}>
              <ArtistCard
                artist={{
                  slug: a.slug,
                  stageName: a.stageName,
                  formatType: a.formatType,
                  baseCity: a.baseCity,
                  genres: a.genres,
                  cacheMin: a.cacheMin,
                  cacheMax: a.cacheMax,
                  cachePublic: a.cachePublic,
                  currency: a.currency,
                  completenessScore: a.completenessScore,
                  coverUrl: a.coverUrl,
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-8 text-center text-paper-mute">
          Aún no hay artistas en esta categoría. ¡Sé el primero!
        </p>
      )}

      {/* ── Sub-estilos contextuales ─────────────────────────── */}
      {subGenres.length > 0 && (
        <nav
          aria-label={`Estilos de ${PERFORMANCE_CATEGORIES.find((c) => c.value === activeCategory)?.label}`}
          className="flex flex-wrap gap-2 border-t border-graphite-line pt-6"
        >
          {subGenres.map(({ label, genreSlug }) =>
            genreSlug ? (
              <Link
                key={label}
                href={`/generos/${genreSlug}`}
                className="inline-flex items-center rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-dim transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {label}
              </Link>
            ) : (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-mute"
              >
                {label}
              </span>
            )
          )}
        </nav>
      )}
    </div>
  );
}
