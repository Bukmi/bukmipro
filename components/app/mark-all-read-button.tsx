"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllRead } from "@/app/(app)/dashboard/notificaciones/actions";

export function MarkAllReadButton({ unreadCount }: { unreadCount: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={pending || unreadCount === 0}
      onClick={() => start(async () => { await markAllRead(); })}
    >
      {pending ? "Marcando…" : "Marcar todo como leído"}
    </Button>
  );
}
