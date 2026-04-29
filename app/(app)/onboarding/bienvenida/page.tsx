import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCircle2, Image as ImageIcon, Calendar, Eye, Rocket } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canPublishProfile, planStatus } from "@/lib/plan";
import { Button } from "@/components/ui/button";

export const metadata = { title: "¡Bienvenido a Bukmi!" };

async function publishProfile() {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planCode: true, subscriptionStatus: true, trialEndsAt: true },
  });
  if (!user || !canPublishProfile(planStatus(user))) {
    redirect("/dashboard/facturacion");
  }

  await prisma.artistProfile.update({
    where: { userId: session.user.id },
    data: { published: true },
  });
  revalidatePath("/onboarding/bienvenida");
}

type NextStep = {
  href: string;
  Icon: typeof ImageIcon;
  title: string;
  description: string;
  done: boolean;
};

export default async function BienvenidaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Verificamos desde la DB (no del JWT) para evitar race conditions después
  // de skipOnboarding donde el JWT puede llegar desactualizado.
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      slug: true,
      stageName: true,
      completenessScore: true,
      published: true,
      spotifyUrl: true,
      youtubeUrl: true,
      instagramUrl: true,
      cacheMin: true,
      cacheMax: true,
      _count: { select: { media: true, availability: true } },
    },
  });

  if (!artist) redirect("/dashboard");

  const score = artist.completenessScore;

  const steps: NextStep[] = [
    {
      href: "/dashboard/media",
      Icon: ImageIcon,
      title: "Sube una foto",
      description: "Los perfiles con foto consiguen 3× más visitas.",
      done: artist._count.media > 0,
    },
    {
      href: "/dashboard/calendario",
      Icon: Calendar,
      title: "Marca tu disponibilidad",
      description: "Las promotoras filtran por fechas libres.",
      done: artist._count.availability > 0,
    },
    {
      href: `/artista/${artist.slug}`,
      Icon: Eye,
      title: "Ve cómo te ven",
      description: "Revisa tu perfil público antes de publicarlo.",
      done: false,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 aria-hidden className="h-8 w-8 text-accent shrink-0" />
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Onboarding completado</p>
      </div>
      <h1 className="text-display mb-3">
        ¡Bienvenido, {artist.stageName}!
      </h1>
      <p className="text-paper-dim mb-10">
        Tu cuenta está lista. Ahora completa estos pasos para que las promotoras puedan encontrarte.
      </p>

      {/* Publicar perfil — CTA principal */}
      {!artist.published ? (
        <div className="mb-8 rounded-2xl border border-accent/40 bg-accent/10 p-6">
          <div className="flex items-start gap-4">
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Rocket className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-paper">Publica tu perfil para ser visible</p>
              <p className="mt-1 text-sm text-paper-dim">
                Ahora mismo solo tú puedes verlo. Publícalo para aparecer en el buscador de promotoras.
              </p>
            </div>
          </div>
          <form action={publishProfile} className="mt-4">
            <Button type="submit" className="w-full sm:w-auto">
              Publicar perfil ahora →
            </Button>
          </form>
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-semibold text-paper">Perfil publicado — ya apareces en el buscador</p>
            <Link href={`/artistas/${artist.slug}`} className="text-xs text-accent underline-offset-4 hover:underline">
              Ver mi perfil público →
            </Link>
          </div>
        </div>
      )}

      {/* Completeness bar */}
      <div className="mb-10 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <div className="flex items-end justify-between mb-3">
          <p className="text-sm font-semibold text-paper">Completitud del perfil</p>
          <p className="text-3xl font-extrabold text-accent">{score}%</p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Completitud del perfil: ${score}%`}
          className="h-3 overflow-hidden rounded-full bg-graphite-line"
        >
          <div
            className="h-full bg-accent transition-[width] duration-700"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-paper-dim">
          {score < 40
            ? "Añade una bio, foto y tu disponibilidad para despegar."
            : score < 70
            ? "Vas por buen camino. Añade una foto o riders para destacar."
            : "¡Muy bien! Estás entre los perfiles más completos."}
        </p>
      </div>

      {/* Next steps */}
      <h2 className="text-hero mb-5">Próximos pasos</h2>
      <ol className="flex flex-col gap-4 mb-10">
        {steps.map(({ href, Icon, title, description, done }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-start gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line transition-colors hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  done ? "bg-accent/20 text-accent" : "bg-graphite-line text-paper-dim"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${done ? "line-through text-paper-dim" : "text-paper"}`}>
                  {title}
                  {done && (
                    <span className="ml-2 text-xs font-normal not-italic text-accent">(hecho)</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-paper-dim">{description}</p>
              </div>
              <span aria-hidden className="mt-1 text-paper-mute group-hover:text-accent">→</span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard/perfil">Editar perfil completo</Link>
        </Button>
      </div>
    </div>
  );
}
