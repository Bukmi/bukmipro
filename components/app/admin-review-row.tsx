"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { ReviewPerspective } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleReviewHidden } from "@/app/(app)/admin/actions";

type ReviewLite = {
  id: string;
  rating: number;
  body: string | null;
  perspective: ReviewPerspective;
  hiddenAt: Date | null;
  createdAt: Date;
  booking: {
    venueName: string;
    eventDate: Date;
    artistProfile: { stageName: string; slug: string };
  };
};

export function AdminReviewRow({ review }: { review: ReviewLite }) {
  const [pending, start] = useTransition();
  const hidden = Boolean(review.hiddenAt);
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between",
        hidden ? "border-danger/40 bg-danger/5" : "border-graphite-line"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold">{"★".repeat(review.rating)}</span>
          <span className="rounded-full bg-graphite-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper-dim">
            {review.perspective === "PROMOTER" ? "Promotora → Artista" : "Artista → Promotora"}
          </span>
          <Link
            href={`/artista/${review.booking.artistProfile.slug}`}
            target="_blank"
            rel="noopener"
            className="text-xs text-paper-mute hover:text-accent"
          >
            {review.booking.artistProfile.stageName}
          </Link>
          <span className="text-xs text-paper-mute">· {review.booking.venueName}</span>
        </div>
        {review.body && (
          <p className="text-sm text-paper-dim line-clamp-2">{review.body}</p>
        )}
        <time className="text-xs text-paper-mute" dateTime={review.createdAt.toISOString()}>
          {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(review.createdAt)}
        </time>
      </div>
      <Button
        type="button"
        size="sm"
        variant={hidden ? "secondary" : "ghost"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleReviewHidden(review.id);
          })
        }
      >
        {hidden ? "Restaurar" : "Ocultar"}
      </Button>
    </li>
  );
}
