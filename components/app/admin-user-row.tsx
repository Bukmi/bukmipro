"use client";

import { useTransition } from "react";
import type { PlanCode, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toggleUserSuspended } from "@/app/(app)/admin/actions";

type UserLite = {
  id: string;
  email: string;
  role: UserRole;
  planCode: PlanCode;
  suspendedAt: Date | null;
  createdAt: Date;
};

export function AdminUserRow({
  user,
  currentAdminId,
}: {
  user: UserLite;
  currentAdminId: string;
}) {
  const [pending, start] = useTransition();
  const suspended = Boolean(user.suspendedAt);
  const isSelf = user.id === currentAdminId;
  const isAdmin = user.role === "ADMIN";

  return (
    <tr className="border-t border-graphite-line">
      <td className="px-4 py-3 font-medium">{user.email}</td>
      <td className="px-4 py-3 text-paper-dim">{user.role}</td>
      <td className="px-4 py-3 text-paper-dim">{user.planCode}</td>
      <td className="px-4 py-3 text-paper-mute">
        {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(user.createdAt)}
      </td>
      <td className="px-4 py-3">
        {suspended ? (
          <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-bold text-danger">
            Suspendido
          </span>
        ) : (
          <span className="text-xs text-paper-dim">Activo</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          type="button"
          size="sm"
          variant={suspended ? "secondary" : "ghost"}
          disabled={pending || isSelf || isAdmin}
          onClick={() =>
            start(async () => {
              await toggleUserSuspended(user.id);
            })
          }
        >
          {suspended ? "Reactivar" : "Suspender"}
        </Button>
      </td>
    </tr>
  );
}
