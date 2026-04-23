import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  FileText,
  Image as ImageIcon,
  User,
  Search,
  Inbox,
  Building2,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCacheRange } from "@/lib/artist";
import { STATUS_LABEL, STATUS_TONE, formatBudget } from "@/lib/proposal";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { artistProfile: true, promoterProfile: { include: { venues: true } } },
  });
  if (!user) redirect("/login");

  const [mediaCount, ridersCount, availableCount, artistOpenCount] = user.artistProfile
    ? await Promise.all([
        prisma.media.count({ where: { artistProfileId: user.artistProfile.id } }),
        prisma.rider.count({ where: { artistProfileId: user.artistProfile.id } }),
        prisma.availability.count({
          where: { artistProfileId: user.artistProfile.id, status: { not: "FREE" } },
        }),
        prisma.bookingRequest.count({
          where: {
            artistProfileId: user.artistProfile.id,
            status: { in: ["INQUIRY", "NEGOTIATING", "ACCEPTED"] },
          },
        }),
      ])
    : [0, 0, 0, 0];

  const promoterProposals = user.promoterProfile
    ? await prisma.bookingRequest.findMany({
        where: { promoterId: user.promoterProfile.id },
        include: { artistProfile: { select: { stageName: true } } },
        orderBy: { lastActivityAt: "desc" },
        take: 5,
      })
    : [];

  const promoterOpenCount = user.promoterProfile
    ? await prisma.bookingRequest.count({
        where: {
          promoterId: user.promoterProfile.id,
          status: { in: ["INQUIRY", "NEGOTIATING", "ACCEPTED"] },
        },
      })
    : 0;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
        <h1 className="text-hero">
          Hola, {user.artistProfile?.stageName ?? user.promoterProfile?.companyName ?? user.email}.
        </h1>
        <p className="text-paper-dim">
          Cuenta {user.role.toLowerCase()} · Plan {user.planCode} · Estado {user.subscriptionStatus}.
        </p>
      </header>

      {user.artistProfile && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard
              href="/dashboard/perfil"
              Icon={User}
              label="Perfil"
              value={`${user.artistProfile.completenessScore}%`}
              hint="Completado"
            />
            <QuickCard
              href="/dashboard/calendario"
              Icon={Calendar}
              label="Disponibilidad"
              value={availableCount.toString()}
              hint="Fechas marcadas"
            />
            <QuickCard
              href="/dashboard/media"
              Icon={ImageIcon}
              label="Material"
              value={mediaCount.toString()}
              hint="Archivos subidos"
            />
            <QuickCard
              href="/dashboard/riders"
              Icon={FileText}
              label="Riders"
              value={ridersCount.toString()}
              hint="Documentos"
            />
            <QuickCard
              href="/dashboard/propuestas"
              Icon={Inbox}
              label="Propuestas"
              value={artistOpenCount.toString()}
              hint="Abiertas"
            />
          </div>

          <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
            <h2 className="text-base font-extrabold">Tu perfil de artista</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-paper-dim sm:grid-cols-4">
              <dt className="text-paper-mute">Nombre</dt>
              <dd>{user.artistProfile.stageName}</dd>
              <dt className="text-paper-mute">Ciudad</dt>
              <dd>{user.artistProfile.baseCity ?? "—"}</dd>
              <dt className="text-paper-mute">Formato</dt>
              <dd>{user.artistProfile.formatType}</dd>
              <dt className="text-paper-mute">Caché</dt>
              <dd>{formatCacheRange(user.artistProfile.cacheMin, user.artistProfile.cacheMax, user.artistProfile.currency)}</dd>
              <dt className="text-paper-mute">Géneros</dt>
              <dd className="col-span-3">{user.artistProfile.genres.join(", ") || "—"}</dd>
              <dt className="text-paper-mute">Publicado</dt>
              <dd className="col-span-3">{user.artistProfile.published ? "Sí, visible en el buscador" : "No — solo tú lo ves"}</dd>
            </dl>
          </article>
        </>
      )}

      {user.promoterProfile && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickCard
              href="/dashboard/buscar"
              Icon={Search}
              label="Buscar"
              value={"→"}
              hint="Explorar artistas publicados"
            />
            <QuickCard
              href="/dashboard/propuestas"
              Icon={Inbox}
              label="Propuestas"
              value={promoterOpenCount.toString()}
              hint="Abiertas"
            />
            <QuickCard
              href="/dashboard/empresa"
              Icon={Building2}
              label="Venues"
              value={user.promoterProfile.venues.length.toString()}
              hint="Configurados"
            />
          </div>

          <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
            <h2 className="text-base font-extrabold">Últimas propuestas</h2>
            {promoterProposals.length === 0 ? (
              <p className="mt-3 text-sm text-paper-mute">
                Aún no has enviado propuestas. Empieza por el{" "}
                <Link href="/dashboard/buscar" className="font-semibold text-accent underline-offset-4 hover:underline">buscador</Link>.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-graphite-line">
                {promoterProposals.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/propuestas/${p.id}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="font-semibold">{p.artistProfile.stageName}</span>
                      <span className="text-xs text-paper-mute">
                        {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(p.eventDate)} · {formatBudget(p.budgetMin, p.budgetMax, p.currency)}
                      </span>
                      <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide", STATUS_TONE[p.status])}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  );
}

function QuickCard({
  href,
  Icon,
  label,
  value,
  hint,
}: {
  href: string;
  Icon: typeof User;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:border-accent hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-paper-mute">{label}</p>
        <p className="text-2xl font-extrabold text-paper">{value}</p>
        <p className="text-xs text-paper-dim">{hint}</p>
      </div>
    </Link>
  );
}
