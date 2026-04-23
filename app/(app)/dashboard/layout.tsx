import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArtistNav } from "@/components/app/artist-nav";
import { CompletenessWidget } from "@/components/app/completeness-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const artist = await prisma.artistProfile.findUnique({
    where: { userId },
    select: { slug: true, completenessScore: true },
  });

  if (!artist) {
    return <div className="min-h-[60vh]">{children}</div>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside aria-label="Barra lateral" className="flex flex-col gap-6">
        <ArtistNav publicSlug={artist.slug} />
        <CompletenessWidget score={artist.completenessScore} />
      </aside>
      <div className="min-h-[60vh]">{children}</div>
    </div>
  );
}
