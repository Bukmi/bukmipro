import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { AvailabilityCalendar } from "@/components/app/availability-calendar";

export const metadata = { title: "Calendario" };

export default async function CalendarioPage() {
  const { artist } = await requireArtist();
  const availability = await prisma.availability.findMany({
    where: { artistProfileId: artist.id },
    orderBy: { date: "asc" },
  });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">
          Disponibilidad
        </p>
        <h1 className="text-hero">Calendario</h1>
        <p className="text-paper-dim">
          Marca los días libres, tentativos o bloqueados. Las promotoras verán
          tu disponibilidad cuando envíen propuestas.
        </p>
      </header>
      <AvailabilityCalendar availability={availability} />
    </section>
  );
}
