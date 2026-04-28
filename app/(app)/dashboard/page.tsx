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
  CalendarPlus,
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

  const [promoterProposals, promoterOpenCount, promoterCastings, promoterCastingOpenCount] =
    user.promoterProfile
      ? await Promise.all([
          prisma.bookingRequest.findMany({
            where: { promoterId: user.promoterProfile.id },
            include: { artistProfile: { select: { stageName: true } } },
            orderBy: { lastActivityAt: "desc" },
            take: 5,
          }),
          prisma.bookingRequest.count({
            where: {
              promoterId: user.promoterProfile.id,
              status: { in: ["INQUIRY", "NEGOTIATING", "ACCEPTED"] },
            },
          }),
          prisma.castingCall.findMany({
            where: { promoterId: user.promoterProfile.id },
            include: { _count: { select: { applications: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.castingCall.count({
            where: { promoterId: user.promoterProfile.id, status: "OPEN" },
          }),
        ])
      : [[], 0, [], 0];

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

      {/* Nivel 1 — perfil vacío (saltó el onboarding) */}
      {user.artistProfile && user.artistProfile.completenessScore === 0 && (
        <aside
          aria-label="Perfil vacío"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-accent bg-accent/10 px-5 py-5"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-2xl">👋</span>
            <div>
              <p className="font-semibold text-paper">
                Tu perfil está vacío — las promotoras no pueden encontrarte
              </p>
              <p className="text-xs text-paper-dim mt-0.5">
                Tarda menos de 3 minutos. Añade nombre artístico, géneros y una foto para aparecer en el buscador.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/perfil"
            className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-graphite hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
          >
            Completar perfil →
          </Link>
        </aside>
      )}

      {/* Nivel 2 — perfil con datos pero sin publicar */}
      {user.artistProfile && user.artistProfile.completenessScore > 0 && !user.artistProfile.published && (
        <aside
          aria-label="Perfil sin publicar"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-xl">🚀</span>
            <div>
              <p className="text-sm font-semibold text-paper">
                Tu perfil no está publicado — las promotoras no pueden verte
              </p>
              <p className="text-xs text-paper-dim">
                Publícalo cuando estés listo. Solo tú lo ves ahora mismo.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/perfil"
            className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-graphite hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
          >
            Publicar perfil →
          </Link>
        </aside>
      )}

      {/* Nivel 3 — publicado pero incompleto */}
      {user.artistProfile && user.artistProfile.published && user.artistProfile.completenessScore < 70 && (
        <aside
          aria-label="Mejora tu perfil"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-graphite-line bg-graphite-soft px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-xl">✦</span>
            <div>
              <p className="text-sm font-semibold text-paper">
                Perfil al {user.artistProfile.completenessScore}% — complétalo para aparecer en más búsquedas
              </p>
              <p className="text-xs text-paper-dim">
                Añade una foto, tu disponibilidad o un rider para subir posiciones.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/perfil"
            className="shrink-0 rounded-xl border border-graphite-line px-4 py-2 text-sm font-bold text-paper hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
          >
            Completar perfil →
          </Link>
        </aside>
      )}

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              href="/dashboard/casting"
              Icon={CalendarPlus}
              label="Eventos propios"
              value={promoterCastingOpenCount.toString()}
              hint="Abiertos"
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

          {promoterCastings.length > 0 && (
            <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">Últimos eventos propios</h2>
                <Link href="/dashboard/casting" className="text-xs text-accent underline-offset-4 hover:underline">Ver todos</Link>
              </div>
              <ul className="mt-3 flex flex-col divide-y divide-graphite-line">
                {promoterCastings.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/casting/${c.id}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span className="font-semibold">{c.title}</span>
                      <span className="text-xs text-paper-mute">
                        {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(c.eventDate)} · {c._count.applications} candidato{c._count.applications !== 1 ? "s" : ""}
                      </span>
                      <span className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                        c.status === "OPEN" ? "bg-accent/20 text-accent" : "bg-graphite-line text-paper-dim"
                      )}>
                        {c.status === "OPEN" ? "Abierto" : c.status === "CLOSED" ? "Cerrado" : "Cancelado"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          )}
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
