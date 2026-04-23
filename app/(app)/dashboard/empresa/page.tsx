import { requirePromoter } from "@/lib/session";

export const metadata = { title: "Empresa y venues" };

export default async function EmpresaPage() {
  const { promoter } = await requirePromoter();

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Empresa</p>
        <h1 className="text-hero">{promoter.companyName}</h1>
        <p className="text-paper-dim">
          Revisa los venues configurados. El editor de empresa llega en el Sprint 4.
        </p>
      </header>

      <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Datos de la empresa</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-paper-dim sm:grid-cols-4">
          <dt className="text-paper-mute">Tipo</dt>
          <dd>{promoter.companyType}</dd>
          <dt className="text-paper-mute">CIF</dt>
          <dd>{promoter.cif ?? "—"}</dd>
          <dt className="text-paper-mute">Email</dt>
          <dd className="col-span-3 break-all">{promoter.contactEmail ?? "—"}</dd>
        </dl>
      </article>

      <article className="rounded-2xl bg-graphite-soft p-6 ring-1 ring-graphite-line">
        <h2 className="text-base font-extrabold">Venues</h2>
        {promoter.venues.length === 0 ? (
          <p className="mt-3 text-sm text-paper-mute">Aún no has añadido venues.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {promoter.venues.map((v) => (
              <li key={v.id} className="rounded-xl bg-graphite p-4 ring-1 ring-graphite-line">
                <p className="text-sm font-extrabold">{v.name}</p>
                <p className="text-xs text-paper-dim">
                  {v.city} · aforo {v.capacity} · {v.venueType}
                </p>
                {v.defaultGenres.length > 0 && (
                  <p className="mt-2 text-xs text-paper-mute">
                    {v.defaultGenres.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
