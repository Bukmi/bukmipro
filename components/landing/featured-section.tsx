"use client";

import { useState } from "react";
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
  formatType: "SOLISTA" | "DUO" | "TRIO" | "GRUPO" | "COMPANIA";
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
  const [activeSubGenre, setActiveSubGenre] = useState<string | null>(null);

  const subGenres = activeCategory ? CATEGORY_SUBGENRES[activeCategory] : [];

  const filtered = artists.filter((a) => {
    if (activeCategory && a.category !== activeCategory) return false;
    if (activeSubGenre && !a.genres.some((g) => g.toLowerCase() === activeSubGenre.toLowerCase())) return false;
    return true;
  });

  function selectCategory(value: PerformanceCategoryValue | null) {
    setActiveCategory(value);
    setActiveSubGenre(null); // reset sub-filtro al cambiar categoría
  }

  const tabBase =
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite";
  const tabActive = "border-accent bg-accent text-accent-ink";
  const tabIdle = "border-graphite-line text-paper-dim hover:border-accent hover:text-accent";

  const pillBase =
    "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite";
  const pillActive = "border-accent bg-accent/15 text-accent font-semibold";
  const pillIdle = "border-graphite-line text-paper-dim hover:border-accent hover:text-accent";

  return (
    <div className="flex flex-col gap-8">
      {/* ── Tabs de primer nivel ─────────────────────────────── */}
      <div role="group" aria-label="Categorías" className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectCategory(null)}
          aria-pressed={!activeCategory}
          className={`${tabBase} ${!activeCategory ? tabActive : tabIdle}`}
        >
          Todos
        </button>
        {PERFORMANCE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => selectCategory(c.value)}
            aria-pressed={activeCategory === c.value}
            className={`${tabBase} ${activeCategory === c.value ? tabActive : tabIdle}`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Sub-estilos contextuales ──────────────────────────── */}
      {subGenres.length > 0 && (
        <div role="group" aria-label="Estilos" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubGenre(null)}
            aria-pressed={!activeSubGenre}
            className={`${pillBase} ${!activeSubGenre ? pillActive : pillIdle}`}
          >
            Todos los estilos
          </button>
          {subGenres.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveSubGenre(activeSubGenre === label ? null : label)}
              aria-pressed={activeSubGenre === label}
              className={`${pillBase} ${activeSubGenre === label ? pillActive : pillIdle}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid de artistas ─────────────────────────────────── */}
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
    </div>
  );
}
