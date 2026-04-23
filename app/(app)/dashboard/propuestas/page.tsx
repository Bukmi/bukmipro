import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, formatBudget, isOpen } from "@/lib/proposal";

export const metadata = { title: "Propuestas" };

export default async function ProposalsInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { estado } = await searchParams;

  const filter = estado === "open" ? "OPEN" : estado === "final" ? "FINAL" : "ALL";

  const statusWhere =
    filter === "OPEN"
      ? { status: { in: ["INQUIRY", "NEGOTIATING", "ACCEPTED"] as const } }
      : filter === "FINAL"
        ? { status: { in: ["BOOKED", "REJECTED", "CANCELLED"] as const } }
        : {};

  let bookings;
  let perspective: "ARTIST" | "PROMOTER";
  if (session.user.role === "ARTIST") {
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!artist) redirect("/onboarding");
    perspective = "ARTIST";
    bookings = await prisma.bookingRequest.findMany({
      where: { artistProfileId: artist.id, ...statusWhere },
      include: { promoter: { select: { companyName: true } } },
      orderBy: [{ lastActivityAt: "desc" }],
    });
  } else {
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!promoter) redirect("/onboarding");
    perspective = "PROMOTER";
    bookings = await prisma.bookingRequest.findMany({
      where: { promoterId: promoter.id, ...statusWhere },
      include: { artistProfile: { select: { stageName: true } } },
      orderBy: [{ lastActivityAt: "desc" }],
    });
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">
          {perspective === "ARTIST" ? "Propuestas recibidas" : "Propuestas enviadas"}
        </p>
        <h1 className="text-hero">Bandeja de propuestas</h1>
        <p className="text-paper-dim">
          {perspective === "ARTIST"
            ? "Propuestas que te han enviado las promotoras. Responde para avanzar el booking."
            : "Seguimiento de las propuestas que has enviado a artistas."}
        </p>
      </header>

      <nav aria-label="Filtro de estado" className="flex gap-2">
        {[
          { key: "ALL", label: "Todas", href: "/dashboard/propuestas" },
          { key: "OPEN", label: "Abiertas", href: "/dashboard/propuestas?estado=open" },
          { key: "FINAL", label: "Cerradas", href: "/dashboard/propuestas?estado=final" },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <Link
              key={f.key}
              href={f.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
                active ? "bg-accent text-graphite" : "bg-graphite-soft text-paper-dim hover:text-paper"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite-line p-12 text-center">
          <Inbox aria-hidden className="h-8 w-8 text-paper-mute" />
          <p className="text-paper-dim">
            {perspective === "ARTIST"
              ? "Aún no has recibido propuestas. Asegúrate de tener el perfil publicado."
              : "Aún no has enviado propuestas. Explora el buscador para encontrar artistas."}
          </p>
          {perspective === "PROMOTER" && (
            <Link
              href="/dashboard/buscar"
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              Ir al buscador
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => {
            const counterparty =
              perspective === "ARTIST"
                ? (b as typeof b & { promoter: { companyName: string } }).promoter.companyName
                : (b as typeof b & { artistProfile: { stageName: string } }).artistProfile.stageName;
            return (
              <li key={b.id}>
                <Link
                  href={`/dashboard/propuestas/${b.id}`}
                  className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.15em] text-paper-mute">
                      {new Intl.DateTimeFormat("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(b.eventDate)}
                    </p>
                    <p className="text-base font-extrabold">{counterparty}</p>
                    <p className="text-sm text-paper-dim">
                      {b.venueName} · {b.eventCity} · {formatBudget(b.budgetMin, b.budgetMax, b.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                        STATUS_TONE[b.status]
                      )}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                    {isOpen(b.status) && (
                      <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
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
