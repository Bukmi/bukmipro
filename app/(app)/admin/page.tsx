import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminUserRow } from "@/components/app/admin-user-row";
import { AdminReviewRow } from "@/components/app/admin-review-row";
import { AdminArtistRow } from "@/components/app/admin-artist-row";

export const metadata = { title: "Administración" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, artists, reviews, totals] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        role: true,
        suspendedAt: true,
        createdAt: true,
        planCode: true,
      },
    }),
    prisma.artistProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        slug: true,
        stageName: true,
        baseCity: true,
        published: true,
        completenessScore: true,
      },
    }),
    prisma.bookingReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        rating: true,
        body: true,
        perspective: true,
        hiddenAt: true,
        createdAt: true,
        booking: {
          select: {
            venueName: true,
            eventDate: true,
            artistProfile: { select: { stageName: true, slug: true } },
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  const suspended = users.filter((u) => u.suspendedAt).length;
  const hidden = reviews.filter((r) => r.hiddenAt).length;

  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Administración</p>
        <h1 className="text-hero">Panel interno</h1>
        <p className="text-paper-dim">
          {totals} cuentas · {suspended} suspendidas · {hidden} valoraciones ocultas.
        </p>
      </header>

      <section aria-labelledby="admin-users" className="flex flex-col gap-4">
        <h2 id="admin-users" className="text-xl font-extrabold">Usuarios recientes</h2>
        <div className="overflow-hidden rounded-2xl border border-graphite-line">
          <table className="min-w-full text-sm">
            <thead className="bg-graphite-soft text-left text-xs uppercase tracking-wide text-paper-mute">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <AdminUserRow key={u.id} user={u} currentAdminId={session.user.id} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="admin-artists" className="flex flex-col gap-4">
        <h2 id="admin-artists" className="text-xl font-extrabold">Artistas</h2>
        <div className="overflow-hidden rounded-2xl border border-graphite-line">
          <table className="min-w-full text-sm">
            <thead className="bg-graphite-soft text-left text-xs uppercase tracking-wide text-paper-mute">
              <tr>
                <th className="px-4 py-3">Artista</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Completitud</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((a) => (
                <AdminArtistRow key={a.id} artist={a} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="admin-reviews" className="flex flex-col gap-4">
        <h2 id="admin-reviews" className="text-xl font-extrabold">Últimas valoraciones</h2>
        {reviews.length === 0 ? (
          <p className="text-paper-dim">Todavía no hay valoraciones.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <AdminReviewRow key={r.id} review={r} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
