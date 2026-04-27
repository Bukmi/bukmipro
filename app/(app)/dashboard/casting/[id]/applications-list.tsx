"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { selectApplication, closeCasting } from "./actions";
import type { CastingStatus, ApplicationStatus, FormatType } from "@prisma/client";

type Application = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: Date;
  artistProfile: {
    id: string;
    stageName: string;
    slug: string;
    formatType: FormatType;
    baseCity: string | null;
    genres: string[];
    cacheMin: number | null;
    cacheMax: number | null;
    currency: string;
    completenessScore: number;
    media: { url: string }[];
  };
};

const APP_TONE: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  ACCEPTED: "bg-accent/20 text-accent",
  REJECTED: "bg-graphite-line text-paper-mute",
};
const APP_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Seleccionado",
  REJECTED: "Rechazado",
};
const FORMAT_LABEL: Record<FormatType, string> = { SOLO: "Solo", BAND: "Banda", DJ: "DJ" };

function formatCache(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return "Caché a negociar";
  const fmt = (n: number) => n.toLocaleString("es-ES") + " " + currency;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Desde ${fmt(min)}`;
  return `Hasta ${fmt(max!)}`;
}

export function ApplicationsList({
  castingCallId,
  applications,
  castingStatus,
  isOpen,
}: {
  castingCallId: string;
  applications: Application[];
  castingStatus: CastingStatus;
  isOpen: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(applicationId: string) {
    if (!confirm("¿Seleccionar este artista? Se notificará a todos los candidatos.")) return;
    startTransition(async () => {
      await selectApplication(castingCallId, applicationId);
    });
  }

  function handleClose() {
    if (!confirm("¿Cerrar el plazo de candidaturas?")) return;
    startTransition(async () => {
      await closeCasting(castingCallId);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">
          Candidaturas <span className="text-paper-mute font-normal">({applications.length})</span>
        </h2>
        {isOpen && (
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-sm text-paper-dim hover:text-paper underline-offset-4 hover:underline"
          >
            Cerrar plazo
          </button>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-graphite-line p-8 text-center text-paper-mute text-sm">
          Aún no hay candidaturas. {isOpen ? "El plazo sigue abierto." : ""}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {applications.map((app) => {
            const cover = app.artistProfile.media[0]?.url;
            return (
              <li
                key={app.id}
                className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line sm:flex-row sm:items-start"
              >
                {/* Avatar */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-graphite">
                  {cover ? (
                    <Image src={cover} alt="" aria-hidden fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-paper-mute text-xs">Sin foto</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold">{app.artistProfile.stageName}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-paper-dim">
                        <span>{FORMAT_LABEL[app.artistProfile.formatType]}</span>
                        {app.artistProfile.baseCity && (
                          <span className="flex items-center gap-1"><MapPin aria-hidden className="h-3 w-3" />{app.artistProfile.baseCity}</span>
                        )}
                        {app.artistProfile.genres.length > 0 && (
                          <span>{app.artistProfile.genres.slice(0, 3).join(", ")}</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-paper mt-1">
                        {formatCache(app.artistProfile.cacheMin, app.artistProfile.cacheMax, app.artistProfile.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-paper-mute">
                        <Star aria-hidden className="h-3 w-3" /> {app.artistProfile.completenessScore}%
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide", APP_TONE[app.status])}>
                        {APP_LABEL[app.status]}
                      </span>
                    </div>
                  </div>

                  {app.message && (
                    <p className="text-sm text-paper-dim italic border-l-2 border-graphite-line pl-3">
                      "{app.message}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-1">
                    <Link
                      href={`/dashboard/buscar/${app.artistProfile.slug}`}
                      target="_blank"
                      className="text-xs text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Ver perfil completo
                    </Link>
                    {castingStatus === "OPEN" && app.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => handleSelect(app.id)}
                        disabled={isPending}
                        className="text-xs h-7 px-3"
                      >
                        Seleccionar este artista
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
