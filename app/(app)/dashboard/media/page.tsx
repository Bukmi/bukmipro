import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { MediaGallery } from "@/components/app/media-gallery";

export const metadata = { title: "Material audiovisual" };

export default async function MediaPage() {
  const { artist } = await requireArtist();
  const items = await prisma.media.findMany({
    where: { artistProfileId: artist.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">
          Material
        </p>
        <h1 className="text-hero">Fotos, videos y tracks</h1>
        <p className="text-paper-dim">
          Añade contenido para que las promotoras puedan valorar tu propuesta.
          Mínimo 3 fotos y 1 track recomendado.
        </p>
      </header>
      <MediaGallery items={items} />
    </section>
  );
}
