"use client";

import { useMemo, useState, useTransition } from "react";
import type { Availability, AvailabilityStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { setAvailability } from "@/app/(app)/dashboard/calendario/actions";

type Props = { availability: Availability[] };

const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  FREE: "Libre",
  TENTATIVE: "Tentativa",
  BLOCKED: "Bloqueada",
  BOOKED: "Confirmada",
};

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

function buildMonthGrid(year: number, month: number) {
  const first = startOfMonth(year, month);
  // Monday-first: 0=Mon … 6=Sun
  const weekday = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < weekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function AvailabilityCalendar({ availability }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)));
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const statusByDate = useMemo(() => {
    const m = new Map<string, AvailabilityStatus>();
    for (const a of availability) m.set(toKey(a.date), a.status);
    return m;
  }, [availability]);

  const cells = buildMonthGrid(cursor.getUTCFullYear(), cursor.getUTCMonth());
  const monthLabel = cursor.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function shiftMonth(delta: number) {
    const d = new Date(cursor);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setCursor(d);
    setSelected(null);
  }

  function submit(status: AvailabilityStatus | "FREE") {
    if (!selected) return;
    const fd = new FormData();
    fd.set("date", selected);
    fd.set("status", status);
    startTransition(async () => {
      const res = await setAvailability({}, fd);
      setToast(res.ok ? `Fecha ${selected} marcada como ${STATUS_LABEL[status as AvailabilityStatus] ?? "libre"}` : res.error ?? "Error");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold capitalize">{monthLabel}</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div role="grid" aria-label={`Calendario de ${monthLabel}`} className="overflow-hidden rounded-2xl bg-graphite-soft ring-1 ring-graphite-line">
        <div role="row" className="grid grid-cols-7 border-b border-graphite-line bg-graphite text-xs font-bold uppercase tracking-wider text-paper-mute">
          {WEEK_LABELS.map((w) => (
            <div role="columnheader" key={w} className="px-2 py-2 text-center">
              {w}
            </div>
          ))}
        </div>
        <div role="rowgroup" className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} role="gridcell" aria-hidden className="h-14 border border-graphite-line/30" />;
            const key = toKey(cell);
            const status = statusByDate.get(key);
            const isSelected = selected === key;
            const label = `${cell.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${status ? `, ${STATUS_LABEL[status]}` : ", libre"}`;
            return (
              <div role="gridcell" key={key} className="border border-graphite-line/30">
                <button
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "flex h-14 w-full flex-col items-center justify-center text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                    isSelected && "bg-accent/20",
                    status === "TENTATIVE" && !isSelected && "bg-accent/10",
                    status === "BLOCKED" && !isSelected && "bg-danger/20",
                    status === "BOOKED" && !isSelected && "bg-success/20"
                  )}
                >
                  <span className={cn("font-semibold", status === "BOOKED" && "text-success", status === "BLOCKED" && "text-danger")}>
                    {cell.getUTCDate()}
                  </span>
                  {status && status !== "FREE" && (
                    <span aria-hidden className="mt-0.5 h-1 w-4 rounded-full bg-current opacity-60" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">{toast}</div>

      <div className="flex flex-col gap-3 rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line">
        <p className="text-sm text-paper-dim">
          {selected
            ? <>Fecha seleccionada: <strong className="text-paper">{selected}</strong></>
            : "Selecciona una fecha para cambiar su estado."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" disabled={!selected || pending} onClick={() => submit("FREE")}>
            Marcar libre
          </Button>
          <Button size="sm" variant="secondary" disabled={!selected || pending} onClick={() => submit("TENTATIVE")}>
            Tentativa
          </Button>
          <Button size="sm" variant="danger" disabled={!selected || pending} onClick={() => submit("BLOCKED")}>
            Bloqueada
          </Button>
        </div>
        <p className="text-xs text-paper-mute">
          Las fechas <strong className="text-success">confirmadas</strong> solo
          se pueden desbloquear desde el detalle del booking.
        </p>
      </div>
    </div>
  );
}
