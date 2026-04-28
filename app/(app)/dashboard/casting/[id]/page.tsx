import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, CalendarPlus, Clock, Euro, Music, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ApplyPanel } from "./apply-panel";
import { ApplicationsList } from "./applications-list";
import type { CastingStatus, ApplicationStatus } from "@prisma/client";

export const metadata = { title: "Evento abierto" };

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

const FORMAT_LABEL: Record<string, string> = { SOLISTA: "Solista", DUO: "Dúo", TRIO: "Trío", GRUPO: "Grupo (3-10 pax)", COMPANIA: "Compañía (+10 pax)" };

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function formatDeadline(d: Date) {
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Plazo cerrado";
  if (diff === 0) return "Cierra hoy";
  return `Cierra en ${diff} día${diff === 1 ? "" : "s"}`;
}

export default async function CastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const casting = await prisma.castingCall.findUnique({
    where: { id },
    include: {
      promoter: { select: { id: true, companyName: true, userId: true } },
      applications: {
        include: {
          artistProfile: {
            select: {
              id: true,
              stageName: true,
              slug: true,
              formatType: true,
              baseCity: true,
              genres: true,
              cacheMin: true,
              cacheMax: true,
              currency: true,
              completenessScore: true,
              media: { where: { kind: "PHOTO" }, take: 1, orderBy: { sortOrder: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!casting) notFound();

  const isArtist = session.user.role === "ARTIST";
  const isPromoter = ["PROMOTER", "OFFICE"].includes(session.user.role);

  let artistProfileId: string | null = null;
  let myApplication: { status: ApplicationStatus; message: string | null } | null = null;

  if (isArtist) {
    const ap = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    artistProfileId = ap?.id ?? null;
    const app = casting.applications.find((a) => a.artistProfileId === artistProfileId);
    if (app) myApplication = { status: app.status, message: app.message };
  }

  const isOwner = isPromoter && casting.promoter.userId === session.user.id;
  const isOpen = casting.status === "OPEN" && new Date() <= casting.applyDeadline;

  return (
    <section className="flex flex-col gap-8">
      <div>
        <Link
          href="/dashboard/casting"
          className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" /> Volver a eventos
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-paper-mute">{casting.promoter.companyName}</p>
            <h1 className="text-2xl font-extrabold">{casting.title}</h1>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", STATUS_TONE[casting.status])}>
            {STATUS_LABEL[casting.status]}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-paper-dim">
          <span className="flex items-center gap-2"><MapPin aria-hidden className="h-4 w-4" /> {casting.venueName} · {casting.venueCity}</span>
          <span className="flex items-center gap-2"><CalendarPlus aria-hidden className="h-4 w-4" /> {formatDate(casting.eventDate)}</span>
          <span className="flex items-center gap-2"><Clock aria-hidden className="h-4 w-4" /> {formatDeadline(casting.applyDeadline)}</span>
          {casting.formatType && (
            <span className="flex items-center gap-2"><Music aria-hidden className="h-4 w-4" /> {FORMAT_LABEL[casting.formatType]}</span>
          )}
          {casting.estimatedCache && (
            <span className="flex items-center gap-2"><Euro aria-hidden className="h-4 w-4" /> {casting.estimatedCache.toLocaleString("es-ES")} €</span>
          )}
        </div>

        {casting.description && (
          <p className="text-sm text-paper-dim whitespace-pre-line border-t border-graphite-line pt-4">
            {casting.description}
          </p>
        )}
      </div>

      {/* Artist: apply panel */}
      {isArtist && artistProfileId && (
        <ApplyPanel
          castingCallId={id}
          isOpen={isOpen}
          myApplication={myApplication}
        />
      )}

      {/* Promoter: applications list */}
      {isOwner && (
        <ApplicationsList
          castingCallId={id}
          applications={casting.applications}
          castingStatus={casting.status}
          isOpen={isOpen}
        />
      )}
    </section>
  );
}
