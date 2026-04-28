import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findGenreBySlug, GENRE_SLUGS } from "@/lib/genres";
import { ArtistCard } from "@/components/public/artist-card";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return GENRE_SLUGS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const genre = findGenreBySlug(slug);
  if (!genre) return { title: "Género" };
  return {
    title: `Artistas de ${genre.name} en España · Bukmi`,
    description: `Bandas, solistas y DJs de ${genre.name} disponibles para conciertos. Disponibilidad real, caché orientativo y contratación directa.`,
    alternates: { canonical: `/generos/${genre.slug}` },
    openGraph: {
      title: `Artistas de ${genre.name} · Bukmi`,
      description: `Descubre artistas de ${genre.name} disponibles para directo.`,
      url: `/generos/${genre.slug}`,
      type: "website",
    },
  };
}

export const revalidate = 3600;

export default async function GenrePage({ params }: { params: Params }) {
  const { slug } = await params;
  const genre = findGenreBySlug(slug);
  if (!genre) notFound();

  const artists = await prisma.artistProfile.findMany({
    where: { published: true, genres: { has: genre.name } },
    include: {
      media: { where: { kind: "PHOTO" }, take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ completenessScore: "desc" }, { updatedAt: "desc" }],
    take: 60,
  });

  return (
    <>
      <SiteHeader />
      <main id="main" className="container-hero flex flex-col gap-10 py-16">
        <nav aria-label="Migas de pan" className="text-xs text-paper-mute">
          <Link href="/" className="hover:text-accent">Inicio</Link>
          <span aria-hidden> / </span>
          <Link href="/artistas" className="hover:text-accent">Artistas</Link>
          <span aria-hidden> / </span>
          <span className="text-paper-dim">{genre.name}</span>
        </nav>

        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Género</p>
          <h1 className="text-display max-w-3xl">
            Artistas de <span className="text-accent">{genre.name}</span>
          </h1>
          <p className="max-w-2xl text-lg text-paper-dim">
            {artists.length === 0
              ? `Todavía no tenemos artistas de ${genre.name} publicados. Vuelve pronto o ayúdanos a invitarles.`
              : `${artists.length} ${artists.length === 1 ? "artista" : "artistas"} de ${genre.name} con disponibilidad real en Bukmi.`}
          </p>
        </header>

        {artists.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
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
                    coverUrl: a.media[0]?.url ?? null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        <aside aria-labelledby="other-genres" className="rounded-2xl border border-graphite-line p-6">
          <h2 id="other-genres" className="text-lg font-extrabold">Otros géneros</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {GENRE_SLUGS.filter((g) => g.slug !== genre.slug).map(({ name, slug: gslug }) => (
              <li key={gslug}>
                <Link
                  href={`/generos/${gslug}`}
                  className="inline-flex items-center rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-dim hover:border-accent hover:text-accent"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
