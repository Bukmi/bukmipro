"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  options: readonly string[];
  defaultValue?: string[];
  max?: number;
  describedBy?: string;
};

export function GenrePicker({ name, options, defaultValue = [], max = 5, describedBy }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  const toggle = (genre: string) => {
    setSelected((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      if (prev.length >= max) return prev;
      return [...prev, genre];
    });
  };

  return (
    <div>
      <ul role="listbox" aria-multiselectable aria-describedby={describedBy} className="flex flex-wrap gap-2">
        {options.map((g) => {
          const active = selected.includes(g);
          return (
            <li key={g}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(g)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-graphite-line text-paper-dim hover:border-paper/40"
                )}
              >
                {g}
              </button>
            </li>
          );
        })}
      </ul>
      {selected.map((g) => (
        <input key={g} type="hidden" name={name} value={g} />
      ))}
      <p className="mt-3 text-xs text-paper-mute" aria-live="polite">
        {selected.length}/{max} seleccionados
      </p>
    </div>
  );
}
