import { requirePromoter } from "@/lib/session";
import { EmpresaForm } from "@/components/app/empresa-form";
import { VenueManager } from "@/components/app/venue-manager";

export const metadata = { title: "Empresa y venues" };

export default async function EmpresaPage() {
  const { promoter } = await requirePromoter();

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Empresa</p>
        <h1 className="text-hero">{promoter.companyName}</h1>
        <p className="text-paper-dim">
          Gestiona los datos fiscales y los venues que usas para tus propuestas.
        </p>
      </header>

      <article className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Datos de la empresa</h2>
        <EmpresaForm profile={promoter} />
      </article>

      <article className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <VenueManager venues={promoter.venues} />
      </article>
    </section>
  );
}
