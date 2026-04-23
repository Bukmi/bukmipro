import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { RiderManager } from "@/components/app/rider-manager";

export const metadata = { title: "Riders" };

export default async function RidersPage() {
  const { artist } = await requireArtist();
  const items = await prisma.rider.findMany({
    where: { artistProfileId: artist.id },
    orderBy: [{ kind: "asc" }, { version: "desc" }],
  });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">
          Documentación técnica
        </p>
        <h1 className="text-hero">Riders</h1>
        <p className="text-paper-dim">
          Sube tu rider técnico, hospitality y stage plot en PDF. La promotora
          los verá al confirmar el booking.
        </p>
      </header>
      <RiderManager items={items} />
    </section>
  );
}
