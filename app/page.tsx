import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ArtistCard } from "@/components/public/artist-card";
import { PERFORMANCE_CATEGORIES, categoryFromSlug } from "@/lib/categories";

export const revalidate = 600;

const howItWorks = [
  {
    label: "Lo que hacemos",
    tone: "text-accent",
    text: "Ponemos tu propuesta artística delante de promotoras, agencias y festivales que están programando ahora mismo en tu zona y rango de caché.",
  },
  {
    label: "Lo que no hacemos",
    tone: "text-accent",
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
  {
    q: "¿Bukmi me garantiza conciertos?",
    a: "No. Bukmi no es una agencia: es la herramienta que multiplica tus oportunidades. Te damos visibilidad ante promotoras, agencias y festivales, un perfil profesional generado con IA y un canal directo de contratación. El resto —tu propuesta artística— sigue siendo cosa tuya.",
  },
  {
    q: "¿Cómo funciona el matching con promotoras, agencias y festivales?",
    a: "Cuando creas tu perfil, la IA lo estructura con lo que de verdad importa para contratar: estilo, disponibilidad, caché orientativo, riders e historial. A partir de ahí, las promotoras te encuentran en búsquedas o reciben recomendaciones automáticas alineadas con su evento, y te envían propuestas concretas. Sin intermediarios.",
  },
  {
    q: "¿Puedo usar Bukmi si soy artista emergente o sin historial?",
    a: "Sí. Bukmi nace precisamente para artistas que no tienen mánager, booker ni mucho recorrido aún. La IA te ayuda a construir un perfil profesional en minutos a partir de lo que ya tienes, y cuanto antes empieces, antes lo haces crecer dentro de la plataforma.",
  },
  {
    q: "¿Qué pasa cuando una promotora quiere contratarme?",
    a: "Recibes la propuesta dentro de Bukmi, con todo sobre la mesa: fecha, sala y condiciones. Aceptas, negocias o declinas desde la propia plataforma. Y toda la documentación —rider, dosier, contrato, factura— queda guardada en un único sitio. Se acabó perseguir hilos entre WhatsApp, email y llamadas.",
  },
  {
    q: "¿Cuánto cuesta y qué incluye el período de prueba?",
    a: "Tienes 14 días gratis con acceso completo: perfil con IA, propuestas ilimitadas, calendario, almacenamiento y métricas. Después puedes seguir en el plan Artista (24,99 €/mes) o pasar a PRO (49,99 €/mes) si quieres máxima visibilidad y acceso prioritario a oportunidades. ¿Gestionas varios artistas? El plan Oficina aplica un 20 % de descuento.",
  },
  {
    q: "¿Bukmi es una agencia de booking?",
    a: "No. Bukmi es una plataforma: no firmamos en exclusiva, no representamos artistas y no nos llevamos comisión sobre tus conciertos. Conectamos directamente a artistas con promotoras y os damos las herramientas para que la contratación sea transparente, ágil y profesional.",
  },
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

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const activeCategory = cat ? categoryFromSlug(cat) : null;

  const [artistCount, promoterCount, bookedCount, featured] = await Promise.all([
    prisma.artistProfile.count(),
    prisma.promoterProfile.count(),
    prisma.bookingRequest.count({ where: { status: "BOOKED" } }),
    prisma.artistProfile.findMany({
      where: {
        published: true,
        ...(activeCategory ? { category: activeCategory } : {}),
      },
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
            Donde tu show encuentra{" "}
            <span className="text-accent">su escenario</span>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-paper-dim sm:text-xl">
            Bukmi conecta artistas y promotoras sin intermediarios. Menos
            llamadas, menos mensajes, más shows cerrados. Contratos, riders y
            disponibilidad en una sola plataforma.
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
              { value: bookedCount,  label: "Shows cerrados" },
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

        <section
          aria-labelledby="featured"
          className="container-hero flex flex-col gap-8 border-t border-graphite-line py-16"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              Destacados
            </p>
            <h2 id="featured" className="mt-2 text-hero">
              Artistas con disponibilidad real
            </h2>
          </div>

          {/* Tabs de categoría */}
          <nav aria-label="Categorías" className="-mb-2 flex flex-wrap gap-2">
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                !activeCategory
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-graphite-line text-paper-dim hover:border-accent hover:text-accent"
              }`}
            >
              Todos
            </Link>
            {PERFORMANCE_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/?cat=${c.slug}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === c.value
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-graphite-line text-paper-dim hover:border-accent hover:text-accent"
                }`}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </nav>

          {featured.length > 0 ? (
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
                      cachePublic: a.cachePublic,
                      currency: a.currency,
                      completenessScore: a.completenessScore,
                      coverUrl: a.media[0]?.url ?? null,
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

          {/* Categorías como pills de navegación */}
          <nav aria-label="Explorar por categoría" className="flex flex-wrap gap-2 border-t border-graphite-line pt-6">
            {PERFORMANCE_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/?cat=${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-graphite-line px-3 py-1 text-sm text-paper-dim hover:border-accent hover:text-accent transition-colors"
              >
                <span aria-hidden>{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </nav>
        </section>

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
