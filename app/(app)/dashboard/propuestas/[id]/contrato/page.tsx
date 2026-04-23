import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Printer } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatBudget } from "@/lib/proposal";
import { PrintButton } from "@/components/app/print-button";

export const metadata = {
  title: "Contrato",
  robots: { index: false, follow: false },
};

type Params = Promise<{ id: string }>;

export default async function ContractPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      promoter: {
        select: {
          companyName: true,
          cif: true,
          contactEmail: true,
          phone: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
      artistProfile: {
        select: {
          stageName: true,
          baseCity: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
      venue: { select: { name: true, city: true, capacity: true } },
    },
  });
  if (!booking) notFound();
  if (booking.status !== "BOOKED") {
    redirect(`/dashboard/propuestas/${booking.id}`);
  }

  const isArtist = session.user.role === "ARTIST" && booking.artistProfile.userId === session.user.id;
  const isPromoter =
    (session.user.role === "PROMOTER" || session.user.role === "OFFICE") &&
    booking.promoter.userId === session.user.id;
  if (!isArtist && !isPromoter) notFound();

  const dateLabel = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(booking.eventDate);
  const today = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const ref = booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/dashboard/propuestas/${booking.id}`}
          className="inline-flex items-center gap-1 text-sm text-paper-dim hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" /> Volver al booking
        </Link>
        <PrintButton>
          <Printer aria-hidden className="mr-2 h-4 w-4" />
          Imprimir / Guardar como PDF
        </PrintButton>
      </div>

      <article className="rounded-2xl bg-paper p-10 text-graphite shadow-xl ring-1 ring-graphite-line print:rounded-none print:shadow-none print:ring-0">
        <header className="mb-8 flex items-start justify-between gap-6 border-b border-graphite/15 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-graphite/60">Bukmi · Contrato de actuación</p>
            <h1 className="mt-2 text-2xl font-extrabold">Ref. {ref}</h1>
            <p className="text-sm text-graphite/70">Emitido el {today}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-graphite/60">Fecha del evento</p>
            <p className="mt-1 text-lg font-extrabold">{dateLabel}</p>
            {booking.slot && <p className="text-sm text-graphite/70">{booking.slot}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-graphite/15 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-graphite/60">Contratante (promotora)</p>
            <p className="mt-2 text-base font-extrabold">{booking.promoter.companyName}</p>
            {booking.promoter.cif && <p className="text-sm text-graphite/70">CIF: {booking.promoter.cif}</p>}
            <p className="text-sm text-graphite/70">{booking.promoter.contactEmail ?? booking.promoter.user.email}</p>
            {booking.promoter.phone && <p className="text-sm text-graphite/70">{booking.promoter.phone}</p>}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-graphite/60">Artista</p>
            <p className="mt-2 text-base font-extrabold">{booking.artistProfile.stageName}</p>
            {booking.artistProfile.baseCity && (
              <p className="text-sm text-graphite/70">{booking.artistProfile.baseCity}</p>
            )}
            <p className="text-sm text-graphite/70">{booking.artistProfile.user.email}</p>
          </div>
        </section>

        <section className="border-b border-graphite/15 py-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">Detalles del evento</h2>
          <dl className="mt-3 grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <dt className="text-graphite/60">Recinto</dt>
            <dd>
              {booking.venueName}
              {booking.venue?.capacity ? ` — aforo ${booking.venue.capacity}` : ""}
            </dd>
            <dt className="text-graphite/60">Ciudad</dt>
            <dd>{booking.eventCity}</dd>
            {booking.slot && (
              <>
                <dt className="text-graphite/60">Franja</dt>
                <dd>{booking.slot}</dd>
              </>
            )}
            <dt className="text-graphite/60">Caché</dt>
            <dd className="font-extrabold">
              {formatBudget(booking.budgetMin, booking.budgetMax, booking.currency)}
            </dd>
          </dl>
        </section>

        <section className="border-b border-graphite/15 py-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">Notas y acuerdos</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{booking.notes}</p>
        </section>

        <section className="py-6 text-sm leading-relaxed">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">Cláusulas MVP</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>El artista se compromete a actuar en la fecha y recinto indicados, en las condiciones pactadas.</li>
            <li>La promotora abonará el caché acordado contra factura en un plazo máximo de 30 días.</li>
            <li>
              Cancelaciones con menos de 15 días de antelación devengan el 50% del caché, salvo causa mayor.
            </li>
            <li>Ambas partes aceptan la comunicación vía la plataforma Bukmi como válida a efectos de registro.</li>
          </ol>
          <p className="mt-4 text-xs text-graphite/60">
            Contrato borrador generado automáticamente por Bukmi. En Sprint 5 se sustituye por un
            PDF firmado digitalmente.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-10 pt-12">
          <div>
            <div className="h-16 border-b border-graphite/50" aria-hidden />
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-graphite/60">
              Firma promotora
            </p>
          </div>
          <div>
            <div className="h-16 border-b border-graphite/50" aria-hidden />
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-graphite/60">
              Firma artista
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
