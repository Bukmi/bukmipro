import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, FileText, Image as ImageIcon, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCacheRange } from "@/lib/artist";

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

  const [mediaCount, ridersCount, availableCount] = user.artistProfile
    ? await Promise.all([
        prisma.media.count({ where: { artistProfileId: user.artistProfile.id } }),
        prisma.rider.count({ where: { artistProfileId: user.artistProfile.id } }),
        prisma.availability.count({
          where: { artistProfileId: user.artistProfile.id, status: { not: "FREE" } },
        }),
      ])
    : [0, 0, 0];

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
        <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <h2 className="text-base font-extrabold">Tu empresa</h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-paper-dim">
            <dt className="text-paper-mute">Razón social</dt>
            <dd>{user.promoterProfile.companyName}</dd>
            <dt className="text-paper-mute">Tipo</dt>
            <dd>{user.promoterProfile.companyType}</dd>
            <dt className="text-paper-mute">Venues</dt>
            <dd>{user.promoterProfile.venues.length}</dd>
          </dl>
          <p className="mt-4 text-sm text-paper-mute">
            El buscador y la gestión de propuestas llegan en el Sprint 3.
          </p>
        </article>
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
