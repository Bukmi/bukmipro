"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeRosterArtist } from "@/app/(app)/dashboard/oficina/actions";

export function RosterRowActions({ id, artistName }: { id: string; artistName: string }) {
  const [pending, start] = useTransition();

  function handleRemove() {
    if (!confirm(`¿Quitar a ${artistName} del roster?`)) return;
    start(async () => {
      const res = await removeRosterArtist(id);
      if (res.error) alert(res.error);
    });
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="danger"
      aria-label={`Quitar ${artistName}`}
      disabled={pending}
      onClick={handleRemove}
    >
      <Trash2 aria-hidden className="h-4 w-4" />
    </Button>
  );
}
