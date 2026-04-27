export default function BuscarLoading() {
  return (
    <section className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 rounded bg-graphite-soft" />
        <div className="h-9 w-56 rounded-xl bg-graphite-soft" />
        <div className="h-4 w-40 rounded bg-graphite-soft" />
      </div>
      <div className="h-24 rounded-2xl bg-graphite-soft" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col overflow-hidden rounded-2xl bg-graphite-soft">
            <div className="aspect-[4/3] bg-graphite" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-3 w-16 rounded bg-graphite" />
              <div className="h-5 w-32 rounded bg-graphite" />
              <div className="h-3 w-24 rounded bg-graphite" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
