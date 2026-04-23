"use client";

import { useState, type ReactNode } from "react";
import { StepProgress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type Step = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  canAdvance?: () => boolean;
};

type Props = {
  steps: Step[];
  submitLabel: string;
  pending?: boolean;
};

export function Stepper({ steps, submitLabel, pending }: Props) {
  const [current, setCurrent] = useState(0);
  const total = steps.length;
  const step = steps[current];
  const isLast = current === total - 1;

  return (
    <div className="flex flex-col gap-8">
      <StepProgress step={current + 1} total={total} />
      <div aria-live="polite" aria-atomic className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-hero">{step.title}</h2>
          {step.description && (
            <p className="text-paper-dim">{step.description}</p>
          )}
        </header>
        <div>{step.content}</div>
      </div>
      <nav
        aria-label="Navegación del onboarding"
        className="flex items-center justify-between border-t border-graphite-line pt-6"
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0 || pending}
        >
          ← Atrás
        </Button>
        {!isLast ? (
          <Button
            type="button"
            onClick={() => {
              if (step.canAdvance && !step.canAdvance()) return;
              setCurrent((c) => Math.min(total - 1, c + 1));
            }}
          >
            Siguiente →
          </Button>
        ) : (
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Guardando…" : submitLabel}
          </Button>
        )}
      </nav>
    </div>
  );
}
