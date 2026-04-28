"use client";

import { useEffect, useRef, useState } from "react";

type Metric = {
  raw: number;       // valor real de la BD
  label: string;     // "ARTISTAS VERIFICADOS"
  sublabel: string;  // "Solos, bandas y DJ activos"
  prefix?: string;   // "€" si aplica
};

/** Formatea un número para la visualización: ≥1000 → "Xk", ≥1M → "XM" */
function formatDisplay(n: number): { display: number; suffix: string } {
  if (n >= 1_000_000) return { display: Math.round(n / 100_000) / 10, suffix: "M" };
  if (n >= 1_000)     return { display: Math.round(n / 1_000),        suffix: "k" };
  return { display: n, suffix: "" };
}

function CountUpNumber({ raw, prefix }: { raw: number; prefix?: string }) {
  const { display: target, suffix } = formatDisplay(raw);
  const [count, setCount] = useState(0);
  const elRef  = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const duration = 1400;
        const start = performance.now();

        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(eased * target));
          if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={elRef} className="tabular-nums">
      {prefix}
      {count.toLocaleString("es-ES")}
      {suffix && (
        <span className="text-[0.75em] font-extrabold">{suffix}</span>
      )}
    </span>
  );
}

export function MetricsSection({ metrics }: { metrics: Metric[] }) {
  return (
    <section
      aria-labelledby="metrics-heading"
      className="container-hero border-t border-graphite-line py-16"
    >
      <h2 id="metrics-heading" className="sr-only">Bukmi en números</h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col gap-3 ${
              i < metrics.length - 1
                ? "sm:border-r sm:border-graphite-line sm:pr-8"
                : ""
            }`}
          >
            <dd className="text-6xl font-extrabold leading-none text-paper sm:text-7xl">
              <CountUpNumber raw={m.raw} prefix={m.prefix} />
            </dd>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-paper-mute">
                {m.label}
              </dt>
              <p className="text-sm text-paper-dim">{m.sublabel}</p>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
