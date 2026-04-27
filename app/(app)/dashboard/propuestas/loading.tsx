export default function PropuestasLoading() {
  return (
    <section className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-graphite-soft" />
        <div className="h-9 w-56 rounded-xl bg-graphite-soft" />
        <div className="h-4 w-64 rounded bg-graphite-soft" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-graphite-soft" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-graphite-soft" />
        ))}
      </div>
    </section>
  );
}
