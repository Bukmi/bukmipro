import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  STATUS_TONE,
  formatBudget,
  isOpen,
} from "@/lib/proposal";
import { MessageThread } from "@/components/app/message-thread";
import { ProposalActions } from "@/components/app/proposal-actions";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Propuesta" };

export default async function ProposalDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      promoter: { select: { id: true, userId: true, companyName: true } },
      artistProfile: { select: { id: true, userId: true, stageName: true, slug: true } },
      venue: { select: { name: true, city: true, capacity: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) notFound();

  const isArtist = session.user.role === "ARTIST" && booking.artistProfile.userId === session.user.id;
  const isPromoter =
    (session.user.role === "PROMOTER" || session.user.role === "OFFICE") &&
    booking.promoter.userId === session.user.id;
  if (!isArtist && !isPromoter) notFound();

  const perspective = isArtist ? "ARTIST" : "PROMOTER";
  const canReply = isOpen(booking.status);

  const artistOptions =
    isArtist && (booking.status === "INQUIRY" || booking.status === "NEGOTIATING")
      ? [
          { action: "ACCEPT" as const, label: "Aceptar", variant: "primary" as const, confirm: "¿Confirmas que aceptas la propuesta?" },
          { action: "REJECT" as const, label: "Rechazar", variant: "danger" as const, confirm: "¿Rechazar esta propuesta?" },
        ]
      : [];

  const promoterOptions = isPromoter
    ? [
        ...(booking.status === "ACCEPTED"
          ? [{ action: "BOOK" as const, label: "Confirmar booking", variant: "primary" as const, confirm: "¿Confirmar la fecha? Se bloqueará en el calendario del artista." }]
          : []),
        ...(booking.status === "INQUIRY" || booking.status === "NEGOTIATING" || booking.status === "ACCEPTED"
          ? [{ action: "CANCEL" as const, label: "Cancelar propuesta", variant: "ghost" as const, confirm: "¿Cancelar la propuesta?" }]
          : []),
      ]
    : [];

  const options = isArtist ? artistOptions : promoterOptions;
  const counterparty = isArtist ? booking.promoter.companyName : booking.artistProfile.stageName;

  return (
    <section className="flex flex-col gap-8">
      <Link
        href="/dashboard/propuestas"
        className="inline-flex w-fit items-center gap-1 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" /> Volver a propuestas
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
              STATUS_TONE[booking.status]
            )}
          >
            {STATUS_LABEL[booking.status]}
          </span>
          <p className="text-xs uppercase tracking-[0.15em] text-paper-mute">
            {isArtist ? "De promotora" : "Para artista"}
          </p>
        </div>
        <h1 className="text-hero">
          {counterparty}
          {isPromoter && (
            <Link
              href={`/dashboard/buscar/${booking.artistProfile.slug}`}
              className="ml-3 text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Ver perfil
            </Link>
          )}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="flex flex-col gap-6 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-paper-mute">Fecha</dt>
            <dd>
              {new Intl.DateTimeFormat("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(booking.eventDate)}
            </dd>
            <dt className="text-paper-mute">Ciudad</dt>
            <dd>{booking.eventCity}</dd>
            <dt className="text-paper-mute">Recinto</dt>
            <dd>
              {booking.venueName}
              {booking.venue?.capacity ? ` · aforo ${booking.venue.capacity}` : ""}
            </dd>
            {booking.slot && (
              <>
                <dt className="text-paper-mute">Franja</dt>
                <dd>{booking.slot}</dd>
              </>
            )}
            <dt className="text-paper-mute">Presupuesto</dt>
            <dd>{formatBudget(booking.budgetMin, booking.budgetMax, booking.currency)}</dd>
          </dl>

          <MessageThread
            bookingId={booking.id}
            messages={booking.messages}
            perspective={perspective}
            canReply={canReply}
          />
        </article>

        <aside aria-label="Acciones" className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <h2 className="text-base font-extrabold">Acciones</h2>
          {options.length === 0 ? (
            <p className="text-sm text-paper-mute">
              No hay acciones disponibles en este estado.
            </p>
          ) : (
            <ProposalActions bookingId={booking.id} options={options} />
          )}
          <div className="mt-2 flex flex-col gap-1 text-xs text-paper-mute">
            <p>Creada: {new Intl.DateTimeFormat("es-ES").format(booking.createdAt)}</p>
            <p>
              Última actividad:{" "}
              {new Intl.DateTimeFormat("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(booking.lastActivityAt)}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
