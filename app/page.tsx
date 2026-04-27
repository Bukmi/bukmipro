import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ArtistCard } from "@/components/public/artist-card";
import { GENRE_SLUGS } from "@/lib/genres";

export const revalidate = 600;

const howItWorks = [
  {
    label: "Lo que hacemos",
    tone: "text-accent",
    text: "Ponemos tu propuesta artística delante de promotoras, agencias y festivales que están programando ahora mismo en tu zona y rango de caché.",
  },
  {
    label: "Lo que no hacemos",
    tone: "text-paper-mute",
    text: "No somos tu agencia ni te garantizamos conciertos. La negociación final, el caché y el contrato los cierras tú con cada promotora.",
  },
  {
    label: "Lo que ganas",
    tone: "text-accent",
    text: "Dejas de perseguir, ganas tiempo y llegas a quien hasta hoy no te contestaba.",
  },
];

// Preguntas frecuentes — respuestas pendientes de redacción
const faqs: { q: string; a: string }[] = [
  { q: "¿Bukmi me garantiza conciertos?", a: "" },
  { q: "¿Cómo funciona el matching con promotoras, agencias y festivales?", a: "" },
  { q: "¿Puedo usar Bukmi si soy artista emergente o sin historial?", a: "" },
  { q: "¿Qué pasa cuando una promotora quiere contratarme?", a: "" },
  { q: "¿Cuánto cuesta y qué incluye el período de prueba?", a: "" },
  { q: "¿Bukmi es una agencia de booking?", a: "" },
];

const artistBenefits = [
  "Tu perfil, trabajando mientras tú actúas.",
  "Caché orientativo basado en tu tracción",
  "Calendario y riders en un solo sitio",
  "Contratos y facturas sin papeleo",
];

const promoterBenefits = [
  "Recomendaciones IA según aforo y presupuesto",
  "Shortlist y envío multi-artista en minutos",
  "Pipeline Kanban con recordatorios",
  "Contratos, riders y pagos centralizados",
];

export default async function LandingPage() {
  const [artistCount, promoterCount, bookedCount, featured] = await Promise.all([
    prisma.artistProfile.count(),
    prisma.promoterProfile.count(),
    prisma.bookingRequest.count({ where: { status: "BOOKED" } }),
    prisma.artistProfile.findMany({
    where: { published: true },
    include: {
      media: { where: { kind: "PHOTO" }, take: 1, orderBy: { sortOrder: "asc" } },
    },
      orderBy: [{ completenessScore: "desc" }, { updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="container-hero pt-20 pb-16 sm:pt-28">
          <p className="mb-6 inline-block border-l-2 border-accent pl-3 text-xs uppercase tracking-[0.2em] text-paper-dim">
            Live entertainment · España
          </p>
          <h1 className="text-display max-w-4xl">
            Donde tu música encuentra{" "}
            <span className="text-accent">a quien la busca</span>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-paper-dim sm:text-xl">
            Bukmi conecta artistas con promotoras, agencias y festivales que
            están programando ahora. No cerramos conciertos por ti: hacemos que
            tu propuesta llegue a quien encaja. Disponibilidad, riders y
            contratos en una sola plataforma.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/signup?role=ARTIST">Soy artista</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup?role=PROMOTER">Soy promotora</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/login" aria-label="Ya tengo cuenta, iniciar sesión">
                Ya tengo cuenta →
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-paper-dim">
            14 días gratis · todas las funcionalidades · sin tarjeta
          </p>
        </section>

        {/* ── Métricas ─────────────────────────────────────────────── */}
        <section
          aria-labelledby="metrics"
          className="container-hero border-t border-graphite-line py-16"
        >
          <h2 id="metrics" className="sr-only">Bukmi en números</h2>
          <dl className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: artistCount,  label: "Artistas" },
              { value: promoterCount, label: "Promotoras" },
              { value: bookedCount,  label: "Conciertos cerrados" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-paper-mute order-last">
                  {label}
                </dt>
                <dd className="text-5xl font-extrabold tabular-nums text-accent sm:text-6xl">
                  {value.toLocaleString("es-ES")}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Cómo funciona ───────────────────────────────────────── */}
        <section
          aria-labelledby="how-it-works"
          className="container-hero border-t border-graphite-line py-16"
        >
          <h2 id="how-it-works" className="text-hero mb-10">
            Cómo funciona Bukmi
          </h2>
          <dl className="grid gap-8 sm:grid-cols-3">
            {howItWorks.map(({ label, tone, text }) => (
              <div key={label} className="flex flex-col gap-3">
                <dt className={`text-xs font-bold uppercase tracking-[0.2em] ${tone}`}>
                  {label}
                </dt>
                <dd className="text-paper-dim">{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {featured.length > 0 && (
          <section
            aria-labelledby="featured"
            className="container-hero flex flex-col gap-8 border-t border-graphite-line py-16"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Destacados
                </p>
                <h2 id="featured" className="mt-2 text-hero">
                  Artistas con disponibilidad real
                </h2>
              </div>
              <Link
                href="/artistas"
                className="text-sm font-bold text-paper underline underline-offset-4 hover:text-accent"
              >
                Ver todo el directorio →
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((a) => (
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
                      currency: a.currency,
                      completenessScore: a.completenessScore,
                      coverUrl: a.media[0]?.url ?? null,
                    }}
                  />
                </li>
              ))}
            </ul>
            <nav aria-label="Géneros" className="flex flex-wrap gap-2">
              {GENRE_SLUGS.slice(0, 8).map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/generos/${slug}`}
                  className="inline-flex items-center rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-dim hover:border-accent hover:text-accent"
                >
                  {name}
                </Link>
              ))}
            </nav>
          </section>
        )}

        <section
          aria-labelledby="segments"
          className="container-hero grid gap-6 py-20 md:grid-cols-2"
        >
          <h2 id="segments" className="sr-only">
            Elige tu perfil
          </h2>

          <article className="flex flex-col justify-between rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Para artistas</p>
              <h3 className="mt-3 text-hero">Que te encuentren, no al revés.</h3>
              <ul className="mt-8 space-y-3 text-paper-dim">
                {artistBenefits.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild className="mt-10 self-start">
              <Link href="/signup?role=ARTIST">Empezar como artista</Link>
            </Button>
          </article>

          <article className="flex flex-col justify-between rounded-2xl bg-paper p-8 text-graphite ring-1 ring-paper-dim">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Para promotoras</p>
              <h3 className="mt-3 text-hero">Cierra tu programación antes.</h3>
              <ul className="mt-8 space-y-3 text-graphite/80">
                {promoterBenefits.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 rounded-full bg-graphite" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild variant="primary" className="mt-10 self-start">
              <Link href="/signup?role=PROMOTER">Empezar como promotora</Link>
            </Button>
          </article>
        </section>
        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="faq"
          className="container-hero border-t border-graphite-line py-16"
        >
          <h2 id="faq" className="text-hero mb-10">
            Preguntas frecuentes
          </h2>
          <ul className="flex flex-col divide-y divide-graphite-line">
            {faqs.map(({ q, a }) => (
              <li key={q}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-paper [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm">
                    {q}
                    <ChevronDown
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-paper-mute transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  {a ? (
                    <p className="mt-3 text-paper-dim">{a}</p>
                  ) : (
                    <p className="mt-3 text-paper-mute italic text-sm">
                      Respuesta próximamente.
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
