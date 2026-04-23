"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toggleArtistPublished } from "@/app/(app)/admin/actions";

type ArtistLite = {
  id: string;
  slug: string;
  stageName: string;
  baseCity: string;
  published: boolean;
  completenessScore: number;
};

export function AdminArtistRow({ artist }: { artist: ArtistLite }) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-t border-graphite-line">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium">{artist.stageName}</span>
          <Link
            href={`/artista/${artist.slug}`}
            target="_blank"
            rel="noopener"
            className="text-xs text-paper-mute hover:text-accent"
          >
            /artista/{artist.slug}
          </Link>
        </div>
      </td>
      <td className="px-4 py-3 text-paper-dim">{artist.baseCity}</td>
      <td className="px-4 py-3 text-paper-dim">{artist.completenessScore}%</td>
      <td className="px-4 py-3">
        {artist.published ? (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
            Publicado
          </span>
        ) : (
          <span className="text-xs text-paper-dim">Oculto</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          type="button"
          size="sm"
          variant={artist.published ? "ghost" : "secondary"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await toggleArtistPublished(artist.id);
            })
          }
        >
          {artist.published ? "Despublicar" : "Publicar"}
        </Button>
      </td>
    </tr>
  );
}
