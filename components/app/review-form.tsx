"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitReview, type ReviewState } from "@/app/(app)/dashboard/propuestas/actions";

type Props = {
  bookingId: string;
  initial?: { rating: number; body: string | null } | null;
};

export function ReviewForm({ bookingId, initial }: Props) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Tu valoración</legend>
        <div role="radiogroup" aria-label="Puntuación de 1 a 5" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                onClick={() => setRating(n)}
                className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-soft"
              >
                <Star
                  aria-hidden
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active ? "fill-accent text-accent" : "text-paper-mute"
                  )}
                />
              </button>
            );
          })}
        </div>
        {state?.fieldErrors?.rating && (
          <p role="alert" className="text-xs text-danger">{state.fieldErrors.rating}</p>
        )}
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">Comentario (opcional)</span>
        <textarea
          name="body"
          defaultValue={initial?.body ?? ""}
          maxLength={800}
          rows={4}
          className="min-h-[96px] rounded-xl border border-graphite-line bg-graphite px-4 py-3 text-paper placeholder:text-paper-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite-soft"
          placeholder="¿Cómo fue la experiencia? Qué destacarías."
        />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" aria-live="polite" className="rounded-lg bg-success/15 p-3 text-sm text-success">
          Valoración guardada.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || rating === 0} aria-busy={pending}>
          {pending ? "Enviando…" : initial ? "Actualizar valoración" : "Enviar valoración"}
        </Button>
      </div>
    </form>
  );
}
