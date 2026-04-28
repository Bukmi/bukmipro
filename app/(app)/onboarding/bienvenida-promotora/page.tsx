import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Search, Building2, Inbox, CalendarPlus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata = { title: "¡Bienvenido a Bukmi!" };

export default async function BienvenidaPromotoraPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.onboardingStatus !== "COMPLETED") redirect("/onboarding");
  if (session.user.role === "ARTIST") redirect("/onboarding/bienvenida");

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
    select: { companyName: true, companyType: true, _count: { select: { venues: true } } },
  });

  if (!promoter) redirect("/dashboard");

  const isOffice = session.user.role === "OFFICE" || promoter.companyType === "OFFICE";

  const steps = isOffice
    ? [
        {
          href: "/dashboard/buscar",
          Icon: Search,
          title: "Busca artistas para tu roster",
          description: "Filtra por género, ciudad y caché para encontrar a quién representar.",
        },
        {
          href: "/dashboard/oficina",
          Icon: Building2,
          title: "Gestiona tu roster",
          description: "Añade o edita los artistas que representa tu oficina.",
        },
        {
          href: "/dashboard/propuestas",
          Icon: Inbox,
          title: "Sigue tus propuestas",
          description: "Consulta el estado de todas las negociaciones en curso.",
        },
      ]
    : [
        {
          href: "/dashboard/buscar",
          Icon: Search,
          title: "Busca tu primer artista",
          description: "Filtra por género, formato, ciudad y presupuesto.",
        },
        {
          href: "/dashboard/casting",
          Icon: CalendarPlus,
          title: "Publica un evento abierto",
          description: "Deja que los artistas se postulen directamente a tu fecha.",
        },
        {
          href: "/dashboard/empresa",
          Icon: Building2,
          title: "Añade más salas o venues",
          description: "Gestiona todos tus espacios desde un mismo perfil.",
        },
      ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 aria-hidden className="h-8 w-8 text-accent shrink-0" />
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Onboarding completado</p>
      </div>
      <h1 className="text-display mb-3">
        ¡Bienvenido, {promoter.companyName}!
      </h1>
      <p className="text-paper-dim mb-10">
        Tu cuenta está lista. Empieza a encontrar artistas para tus próximas fechas.
      </p>

      {/* Próximos pasos */}
      <h2 className="text-hero mb-5">Próximos pasos</h2>
      <ol className="flex flex-col gap-4 mb-10">
        {steps.map(({ href, Icon, title, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-start gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
            >
              <span
                aria-hidden
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-paper">{title}</p>
                <p className="mt-0.5 text-sm text-paper-dim">{description}</p>
              </div>
              <span aria-hidden className="mt-1 text-paper-mute group-hover:text-accent">→</span>
            </Link>
          </li>
        ))}
      </ol>

      <Button asChild>
        <Link href="/dashboard">Ir al dashboard →</Link>
      </Button>
    </div>
  );
}
