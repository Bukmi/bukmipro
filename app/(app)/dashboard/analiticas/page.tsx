import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bucketByMonth, confirmedAmount, statusBreakdown } from "@/lib/analytics";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/proposal";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analíticas" };

export default async function AnaliticasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;

  let bookings: Array<{
    id: string;
    status: import("@prisma/client").ProposalStatus;
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
    createdAt: Date;
    counterparty: string;
  }> = [];
  let perspective: "ARTIST" | "PROMOTER" = "PROMOTER";
  let views: { last30: number; last90: number } | null = null;

  if (role === "ARTIST") {
    perspective = "ARTIST";
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    });
    if (!artist) redirect("/onboarding");
    const now = new Date();
    const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const [last30, last90] = await Promise.all([
      prisma.profileView.count({
        where: { artistProfileId: artist.id, createdAt: { gte: cutoff30 } },
      }),
      prisma.profileView.count({
        where: { artistProfileId: artist.id, createdAt: { gte: cutoff90 } },
      }),
    ]);
    views = { last30, last90 };
    const rows = await prisma.bookingRequest.findMany({
      where: { artistProfileId: artist.id },
      select: {
        id: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        createdAt: true,
        promoter: { select: { companyName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    bookings = rows.map((r) => ({
      id: r.id,
      status: r.status,
      budgetMin: r.budgetMin,
      budgetMax: r.budgetMax,
      currency: r.currency,
      createdAt: r.createdAt,
      counterparty: r.promoter.companyName,
    }));
  } else if (role === "PROMOTER" || role === "OFFICE") {
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    });
    if (!promoter) redirect("/onboarding");
    const rows = await prisma.bookingRequest.findMany({
      where: { promoterId: promoter.id },
      select: {
        id: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        createdAt: true,
        artistProfile: { select: { stageName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    bookings = rows.map((r) => ({
      id: r.id,
      status: r.status,
      budgetMin: r.budgetMin,
      budgetMax: r.budgetMax,
      currency: r.currency,
      createdAt: r.createdAt,
      counterparty: r.artistProfile.stageName,
    }));
  } else {
    redirect("/dashboard");
  }

  const total = bookings.length;
  const breakdown = statusBreakdown(bookings);
  const bookedCount = breakdown.BOOKED;
  const rejectedCount = breakdown.REJECTED + breakdown.CANCELLED;
  const conversion = total === 0 ? 0 : Math.round((bookedCount / total) * 100);
  const confirmedEuros = confirmedAmount(bookings);
  const monthly = bucketByMonth(bookings, 6);
  const peakTotal = Math.max(1, ...monthly.map((b) => b.total));
  const fmtEur = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const kpis: Array<{ label: string; value: string; hint?: string }> = [
    { label: "Propuestas totales", value: String(total) },
    { label: "Confirmadas (BOOKED)", value: String(bookedCount), hint: `${conversion}% de conversión` },
    { label: "Importe confirmado", value: fmtEur.format(confirmedEuros) },
    { label: "Descartadas", value: String(rejectedCount), hint: "Rechazadas + canceladas" },
  ];

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Analíticas</p>
          <h1 className="text-hero">
            {perspective === "ARTIST" ? "Tu actividad comercial" : "Tu pipeline de booking"}
          </h1>
          <p className="text-paper-dim">Últimos 6 meses de propuestas creadas.</p>
        </div>
        <Link
          href="/dashboard/propuestas/export.csv"
          className="inline-flex items-center gap-2 rounded-xl border border-accent px-4 py-2 text-sm font-bold text-accent hover:bg-accent hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
        >
          <Download aria-hidden className="h-4 w-4" /> Exportar CSV
        </Link>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicadores clave">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-1 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
          >
            <dt className="text-xs uppercase tracking-wide text-paper-mute">{k.label}</dt>
            <dd className="text-2xl font-extrabold text-paper">{k.value}</dd>
            {k.hint && <p className="text-xs text-paper-dim">{k.hint}</p>}
          </div>
        ))}
      </dl>

      {views && (
        <article className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold">Visitas a tu perfil público</h2>
            <p className="text-xs text-paper-mute">Deduplicadas por sesión</p>
          </header>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-xl bg-graphite p-4 ring-1 ring-graphite-line">
              <dt className="text-xs uppercase tracking-wide text-paper-mute">Últimos 30 días</dt>
              <dd className="text-2xl font-extrabold text-paper">{views.last30}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-graphite p-4 ring-1 ring-graphite-line">
              <dt className="text-xs uppercase tracking-wide text-paper-mute">Últimos 90 días</dt>
              <dd className="text-2xl font-extrabold text-paper">{views.last90}</dd>
            </div>
          </dl>
        </article>
      )}

      <article className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-extrabold">Actividad mensual</h2>
          <p className="text-xs text-paper-mute">Barras: creadas · Resaltado: confirmadas</p>
        </header>
        <ol className="flex items-end gap-3" aria-label="Propuestas por mes">
          {monthly.map((b) => {
            const totalH = Math.round((b.total / peakTotal) * 120);
            const bookedH = Math.round((b.booked / peakTotal) * 120);
            return (
              <li key={b.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-[120px] w-full items-end overflow-hidden rounded-xl bg-graphite ring-1 ring-graphite-line">
                  <div
                    className="w-full bg-paper/20"
                    style={{ height: `${totalH}px` }}
                    aria-hidden
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-accent"
                    style={{ height: `${bookedH}px` }}
                    aria-hidden
                  />
                </div>
                <div className="flex flex-col items-center text-xs">
                  <span className="text-paper-dim">{b.label}</span>
                  <span className="font-bold text-paper">
                    {b.total}
                    {b.booked > 0 && <span className="text-accent"> · {b.booked}★</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </article>

      <article className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Reparto por estado</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(breakdown) as Array<keyof typeof breakdown>).map((status) => (
            <li key={status} className="flex items-center justify-between rounded-xl bg-graphite px-4 py-3 ring-1 ring-graphite-line">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase", STATUS_TONE[status])}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-sm font-extrabold">{breakdown[status]}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
