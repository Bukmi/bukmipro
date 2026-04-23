type Props = { score: number };

export function CompletenessWidget({ score }: Props) {
  const pct = Math.max(0, Math.min(100, score));
  const label =
    pct < 40 ? "Perfil incompleto"
    : pct < 75 ? "Vas por buen camino"
    : pct < 100 ? "Casi listo"
    : "Perfil completo";

  return (
    <aside
      aria-label="Progreso del perfil"
      className="rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-paper-mute">Completitud</p>
      <p className="mt-2 text-3xl font-extrabold text-paper">{pct}%</p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Completitud del perfil: ${pct}%`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-graphite-line"
      >
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-paper-dim">{label}</p>
    </aside>
  );
}
