import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  return (
    <section className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Dashboard</p>
      <h1 className="text-hero">
        Hola, {user.artistProfile?.stageName ?? user.promoterProfile?.companyName ?? user.email}.
      </h1>
      <p className="text-paper-dim">
        Cuenta {user.role.toLowerCase()} · Plan {user.planCode} · Estado {user.subscriptionStatus}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
          <h2 className="text-base font-extrabold">Sprint 1 completado</h2>
          <p className="mt-2 text-sm text-paper-dim">
            Cuenta creada y onboarding finalizado. Las features de perfil,
            calendario y pipeline llegan en los Sprints 2–4.
          </p>
        </article>
        {user.artistProfile && (
          <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
            <h2 className="text-base font-extrabold">Tu perfil de artista</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-paper-dim">
              <dt className="text-paper-mute">Nombre</dt>
              <dd>{user.artistProfile.stageName}</dd>
              <dt className="text-paper-mute">Ciudad</dt>
              <dd>{user.artistProfile.baseCity}</dd>
              <dt className="text-paper-mute">Formato</dt>
              <dd>{user.artistProfile.formatType}</dd>
              <dt className="text-paper-mute">Géneros</dt>
              <dd>{user.artistProfile.genres.join(", ") || "—"}</dd>
              <dt className="text-paper-mute">Completitud</dt>
              <dd>{user.artistProfile.completenessScore}%</dd>
            </dl>
          </article>
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
          </article>
        )}
      </div>
    </section>
  );
}
