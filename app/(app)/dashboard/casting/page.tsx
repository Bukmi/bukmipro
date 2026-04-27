import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, MapPin, Clock, Users, Megaphone } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CastingStatus, ApplicationStatus } from "@prisma/client";

export const metadata = { title: "Eventos abiertos" };

const STATUS_LABEL: Record<CastingStatus, string> = {
  OPEN: "Abierto",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado",
};

const STATUS_TONE: Record<CastingStatus, string> = {
  OPEN: "bg-accent/20 text-accent",
  CLOSED: "bg-graphite-line text-paper-dim",
  CANCELLED: "bg-danger/20 text-danger",
};

const APP_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendiente de respuesta",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};

const APP_TONE: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-accent/20 text-accent",
  REJECTED: "bg-danger/20 text-danger",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function formatDeadline(d: Date) {
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return "Plazo cerrado";
  if (diff === 0) return "Cierra hoy";
  return `Cierra en ${diff} día${diff === 1 ? "" : "s"}`;
}

export default async function CastingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isArtist = session.user.role === "ARTIST";

  if (isArtist) {
    // Run both queries in parallel — castings list doesn't depend on artist.id
    const now = new Date();
    const [artist, castings] = await Promise.all([
      prisma.artistProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, castingApplications: { select: { castingCallId: true, status: true } } },
      }),
      prisma.castingCall.findMany({
        where: { status: "OPEN", applyDeadline: { gte: now } },
        include: {
          promoter: { select: { companyName: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { applyDeadline: "asc" },
      }),
    ]);
    if (!artist) redirect("/onboarding");

    const appliedMap = new Map(artist.castingApplications.map((a) => [a.castingCallId, a.status]));

    return (
      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Propuestas abiertas</p>
          <h1 className="text-hero">Eventos que buscan artista</h1>
          <p className="text-paper-dim">
            Promotoras buscando artistas para sus eventos. Aplica y espera su respuesta.
          </p>
        </header>

        {castings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite-line p-12 text-center">
            <Megaphone aria-hidden className="h-8 w-8 text-paper-mute" />
            <p className="text-paper-dim">No hay eventos abiertos en este momento. Vuelve pronto.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {castings.map((c) => {
              const appStatus = appliedMap.get(c.id);
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/casting/${c.id}`}
                    className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-xs uppercase tracking-[0.15em] text-paper-mute">{c.promoter.companyName}</p>
                      <p className="text-base font-extrabold">{c.title}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-paper-dim">
                        <span className="flex items-center gap-1"><MapPin aria-hidden className="h-3 w-3" /> {c.venueName} · {c.venueCity}</span>
                        <span className="flex items-center gap-1"><CalendarPlus aria-hidden className="h-3 w-3" /> {formatDate(c.eventDate)}</span>
                        <span className="flex items-center gap-1"><Clock aria-hidden className="h-3 w-3" /> {formatDeadline(c.applyDeadline)}</span>
                        <span className="flex items-center gap-1"><Users aria-hidden className="h-3 w-3" /> {c._count.applications} candidato{c._count.applications !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {appStatus ? (
                        <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", APP_TONE[appStatus])}>
                          {APP_LABEL[appStatus]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                          Aplicar
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  // PROMOTER view — use relation filter so we can run profile check + castings in parallel
  const [promoter, castings] = await Promise.all([
    prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
    prisma.castingCall.findMany({
      where: { promoter: { userId: session.user.id } },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!promoter) redirect("/onboarding");

  return (
    <section className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Eventos abiertos</p>
          <h1 className="text-hero">Mis eventos</h1>
          <p className="text-paper-dim">Eventos que has publicado para recibir candidaturas de artistas.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/casting/nuevo">+ Nuevo evento</Link>
        </Button>
      </header>

      {castings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite-line p-12 text-center">
          <CalendarPlus aria-hidden className="h-8 w-8 text-paper-mute" />
          <p className="text-paper-dim">Aún no has creado ningún evento abierto.</p>
          <Link href="/dashboard/casting/nuevo" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Crear tu primer evento
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {castings.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/casting/${c.id}`}
                className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.15em] text-paper-mute">
                    {formatDate(c.eventDate)}
                  </p>
                  <p className="text-base font-extrabold">{c.title}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-paper-dim">
                    <span className="flex items-center gap-1"><MapPin aria-hidden className="h-3 w-3" /> {c.venueName} · {c.venueCity}</span>
                    <span className="flex items-center gap-1"><Clock aria-hidden className="h-3 w-3" /> {formatDeadline(c.applyDeadline)}</span>
                    <span className="flex items-center gap-1"><Users aria-hidden className="h-3 w-3" /> {c._count.applications} candidato{c._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", STATUS_TONE[c.status])}>
                  {STATUS_LABEL[c.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
