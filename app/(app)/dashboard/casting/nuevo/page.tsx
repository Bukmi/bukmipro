import { redirect } from "next/navigation";
import { requirePromoter } from "@/lib/session";
import { CreateCastingForm } from "./form";

export const metadata = { title: "Crear nuevo evento" };

export default async function NuevoCastingPage() {
  await requirePromoter();
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Eventos abiertos</p>
        <h1 className="text-hero">Crear nuevo evento</h1>
        <p className="text-paper-dim">
          Publica un evento abierto para que los artistas puedan aplicar. Tú decides quién actúa.
        </p>
      </header>
      <CreateCastingForm />
    </section>
  );
}
