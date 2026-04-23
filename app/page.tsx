import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { CalendarCheck, FileSignature, Sparkles, Users } from "lucide-react";

const artistBenefits = [
  "Perfil editorial generado con IA",
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

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="container-hero pt-20 pb-16 sm:pt-28">
          <p className="mb-6 inline-block border-l-2 border-accent pl-3 text-xs uppercase tracking-[0.2em] text-paper-dim">
            Live entertainment · España
          </p>
          <h1 className="text-display max-w-4xl">
            Booking artístico <span className="text-accent">sin intermediarios</span>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-paper-dim sm:text-xl">
            Bukmi conecta artistas y promotoras directamente. Menos llamadas,
            menos WhatsApp, más conciertos cerrados. Contratos, riders y
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
          <p className="mt-6 text-sm text-paper-mute">
            14 días gratis · todas las funcionalidades · sin tarjeta
          </p>
        </section>

        <section
          aria-labelledby="value-props"
          className="container-hero grid gap-10 border-t border-graphite-line py-16 sm:grid-cols-4"
        >
          <h2 id="value-props" className="sr-only">
            Propuesta de valor
          </h2>
          {[
            { icon: Sparkles, title: "IA editorial", text: "Perfil generado en 60s con bio, caché y tags." },
            { icon: CalendarCheck, title: "Disponibilidad real", text: "Calendario sincronizado, fin del partido de tenis." },
            { icon: Users, title: "Matching directo", text: "Promotoras y artistas sin intermediarios." },
            { icon: FileSignature, title: "Contratos y facturas", text: "Firma digital y documentación centralizada." },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex flex-col gap-3">
              <Icon aria-hidden className="h-6 w-6 text-accent" />
              <h3 className="text-base font-extrabold">{title}</h3>
              <p className="text-sm text-paper-dim">{text}</p>
            </article>
          ))}
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
      </main>
      <SiteFooter />
    </>
  );
}
