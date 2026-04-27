export default function DashboardLoading() {
  return (
    <section className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-graphite-soft" />
        <div className="h-9 w-64 rounded-xl bg-graphite-soft" />
        <div className="h-4 w-48 rounded bg-graphite-soft" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-graphite-soft" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-graphite-soft" />
    </section>
  );
}
