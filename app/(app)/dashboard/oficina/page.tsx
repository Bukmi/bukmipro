import Link from "next/link";
import { redirect } from "next/navigation";
import { Users2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/session";
import { RosterAddForm } from "@/components/app/roster-add-form";
import { RosterRowActions } from "@/components/app/roster-row-actions";

export const metadata = { title: "Roster de oficina" };

export default async function OficinaPage() {
  const { session, promoter } = await requirePromoter();
  if (session.user.role !== "OFFICE") redirect("/dashboard");

  const roster = await prisma.artistRepresentation.findMany({
    where: { promoterId: promoter.id },
    include: {
      artistProfile: {
        select: {
          id: true,
          slug: true,
          stageName: true,
          baseCity: true,
          formatType: true,
          completenessScore: true,
          published: true,
          _count: { select: { proposals: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Oficina</p>
        <h1 className="text-hero">Roster ({roster.length})</h1>
        <p className="text-paper-dim">
          Añade artistas que representas para ver su actividad comercial centralizada.
        </p>
      </header>

      <RosterAddForm />

      {roster.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-graphite-line p-12 text-center text-paper-mute">
          Tu roster está vacío. Añade artistas por su slug público.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {roster.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-graphite ring-1 ring-graphite-line">
                <Users2 aria-hidden className="h-5 w-5 text-paper-dim" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold">{r.artistProfile.stageName}</p>
                <p className="text-xs text-paper-dim">
                  {r.artistProfile.baseCity ?? "Sin ciudad"} · {r.artistProfile.formatType} ·
                  {" "}completitud {r.artistProfile.completenessScore}% ·
                  {" "}{r.artistProfile._count.proposals} propuestas
                </p>
                {r.note && <p className="mt-1 text-xs text-paper-mute">{r.note}</p>}
              </div>
              <Link
                href={`/dashboard/buscar/${r.artistProfile.slug}`}
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
              >
                Ver perfil
              </Link>
              <RosterRowActions id={r.id} artistName={r.artistProfile.stageName} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
