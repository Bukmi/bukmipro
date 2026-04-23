"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const StepProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    step: number;
    total: number;
  }
>(({ className, step, total, ...props }, ref) => {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex justify-between text-xs font-semibold text-paper-mute"
        aria-hidden
      >
        <span>
          Paso {step} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <ProgressPrimitive.Root
        ref={ref}
        value={pct}
        aria-label={`Progreso del onboarding: paso ${step} de ${total}`}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-graphite-line",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
StepProgress.displayName = "StepProgress";
