import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement;
};

export function Field({ id, label, hint, error, required, className, children }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const child = React.cloneElement(children, {
    id,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
    required,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span aria-hidden className="ml-1 text-accent">*</span>}
        </Label>
      </div>
      {child}
      {hint && !error && (
        <p id={hintId} className="text-xs text-paper-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
