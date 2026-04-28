import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Precios · Bukmi",
  description:
    "14 días gratis con acceso completo. Planes para artistas, solistas, bandas y DJs que quieren más shows sin más gestión.",
  alternates: { canonical: "/precios" },
  openGraph: {
    title: "Precios · Bukmi",
    description: "14 días gratis. Sin tarjeta. Planes desde 24,99 €/mes.",
    url: "/precios",
    type: "website",
  },
};

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  highlight: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "artista",
    name: "Artista",
    price: "24,99 €",
    period: "/ mes",
    description: "Para artistas en solitario, bandas y DJs que quieren más visibilidad y organización.",
    cta: "Empezar gratis 14 días",
    ctaHref: "/signup?role=ARTIST&plan=ARTIST",
    highlight: false,
    features: [
      "Perfil profesional con IA",
      "Aparición en buscador de promotoras",
      "Propuestas ilimitadas",
      "Calendario de disponibilidad",
      "Riders y dosieres",
      "Contratos y facturas",
      "Métricas básicas de perfil",
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: "49,99 €",
    period: "/ mes",
    description: "Máxima visibilidad y acceso prioritario. Para artistas con agenda activa.",
    cta: "Empezar gratis 14 días",
    ctaHref: "/signup?role=ARTIST&plan=PRO",
    highlight: true,
    features: [
      "Todo lo del plan Artista",
      "Posición destacada en búsquedas",
      "Acceso prioritario a castings y eventos",
      "Badge verificado en perfil",
      "Métricas avanzadas y comparativa",
      "Soporte prioritario",
    ],
  },
  {
    id: "oficina",
    name: "Oficina",
    price: "desde 19,99 €",
    period: "/ artista / mes",
    description: "Para mánagers y oficinas de booking que gestionan varios artistas. 20% de descuento sobre el plan PRO.",
    cta: "Hablar con el equipo",
    ctaHref: "mailto:hola@bukmi.pro?subject=Plan%20Oficina",
    highlight: false,
    features: [
      "Gestión centralizada de roster",
      "Un panel por artista",
      "Facturación consolidada",
      "20% de descuento sobre PRO",
      "Acceso a estadísticas del roster",
      "Soporte dedicado",
    ],
  },
];

const promoterFeatures = [
  "Buscador con filtros avanzados (ciudad, género, formato, caché)",
  "Shortlist y envío de propuesta multi-artista",
  "Pipeline Kanban con recordatorios",
  "Contratos, riders y pagos centralizados",
  "Recomendaciones IA según aforo y presupuesto",
  "Castings y convocatorias abiertas",
];

export default function PreciosPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-hero flex flex-col gap-20 py-16">
        {/* Header */}
        <header className="flex flex-col gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Precios</p>
          <h1 className="text-display mx-auto max-w-3xl">
            14 días gratis.{" "}
            <span className="text-accent">Sin tarjeta.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-paper-dim">
            Acceso completo desde el primer día. Cancela cuando quieras.
          </p>
        </header>

        {/* Planes artistas */}
        <section aria-labelledby="planes-artistas">
          <h2 id="planes-artistas" className="sr-only">Planes para artistas</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`flex flex-col rounded-2xl p-8 ring-1 ${
                  plan.highlight
                    ? "bg-paper text-graphite ring-paper"
                    : "bg-graphite-soft ring-graphite-line"
                }`}
              >
                {plan.highlight && (
                  <p className="mb-4 inline-flex w-fit rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-graphite">
                    Más popular
                  </p>
                )}
                <h3 className={`text-xl font-extrabold ${plan.highlight ? "text-graphite" : "text-paper"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tabular-nums ${plan.highlight ? "text-graphite" : "text-paper"}`}>
                    {plan.price}
                  </span>
                  <span className={`mb-1 text-sm ${plan.highlight ? "text-graphite/60" : "text-paper-dim"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${plan.highlight ? "text-graphite/70" : "text-paper-dim"}`}>
                  {plan.description}
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        aria-hidden
                        className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-graphite" : "text-accent"}`}
                      />
                      <span className={plan.highlight ? "text-graphite/80" : "text-paper-dim"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    asChild
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full"
                  >
                    <Link href={plan.ctaHref}>{plan.cta}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Promotoras — gratis */}
        <section
          aria-labelledby="promotoras-gratis"
          className="rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line md:p-12"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Para promotoras</p>
              <h2 id="promotoras-gratis" className="mt-3 text-hero">
                Gratis durante el lanzamiento
              </h2>
              <p className="mt-4 text-paper-dim">
                Buscador, propuestas, castings y gestión de riders sin coste mientras estamos en beta.
                Habrá un plan de pago cuando el producto esté maduro — te avisaremos con tiempo.
              </p>
              <Button asChild className="mt-8">
                <Link href="/signup?role=PROMOTER">Crear cuenta de promotora</Link>
              </Button>
            </div>
            <ul className="flex flex-col gap-3">
              {promoterFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-paper-dim">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ precios */}
        <section aria-labelledby="faq-precios" className="mx-auto w-full max-w-2xl">
          <h2 id="faq-precios" className="text-hero mb-8 text-center">Preguntas frecuentes</h2>
          <ul className="flex flex-col divide-y divide-graphite-line">
            {[
              {
                q: "¿Necesito tarjeta para el período de prueba?",
                a: "No. Los 14 días de prueba son completamente gratuitos y sin tarjeta. Solo te pedimos email y nombre artístico.",
              },
              {
                q: "¿Qué pasa al acabar la prueba?",
                a: "Te avisamos por email antes de que expire. Si no introduces datos de pago, tu cuenta pasa a modo lectura — no pierdes tu perfil ni tu historial.",
              },
              {
                q: "¿Puedo cambiar de plan en cualquier momento?",
                a: "Sí. Puedes subir o bajar de plan desde la configuración de cuenta. Los cambios aplican en el siguiente ciclo de facturación.",
              },
              {
                q: "¿Hay descuento para pago anual?",
                a: "Próximamente. Estamos preparando planes anuales con hasta un 20% de descuento. Si quieres que te avisemos, escríbenos a hola@bukmi.pro.",
              },
            ].map(({ q, a }) => (
              <li key={q}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-paper [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm">
                    {q}
                    <span aria-hidden className="ml-4 shrink-0 text-paper-mute transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-paper-dim">{a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA final */}
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Sin excusas</p>
          <h2 className="text-hero mb-6">Empieza gratis hoy.</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup?role=ARTIST">Soy artista</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup?role=PROMOTER">Soy promotora</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
