export default function CastingLoading() {
  return (
    <section className="flex flex-col gap-8 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-graphite-soft" />
          <div className="h-9 w-40 rounded-xl bg-graphite-soft" />
          <div className="h-4 w-56 rounded bg-graphite-soft" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-graphite-soft" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-graphite-soft" />
        ))}
      </div>
    </section>
  );
}
