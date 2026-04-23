import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { MarkAllReadButton } from "@/components/app/mark-all-read-button";

export const metadata = { title: "Notificaciones" };

const TYPE_LABEL: Record<NotificationType, string> = {
  PROPOSAL_CREATED: "Propuesta",
  PROPOSAL_STATUS: "Estado",
  NEW_MESSAGE: "Mensaje",
  REVIEW_RECEIVED: "Valoración",
  SYSTEM: "Sistema",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Notificaciones</p>
          <h1 className="text-hero">Bandeja</h1>
          <p className="text-paper-dim">
            {unread > 0 ? `${unread} sin leer.` : "Estás al día."}
          </p>
        </div>
        <MarkAllReadButton unreadCount={unread} />
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite-line p-12 text-center">
          <Bell aria-hidden className="h-8 w-8 text-paper-mute" />
          <p className="text-paper-dim">No tienes notificaciones todavía.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {notifications.map((n) => {
            const unread = !n.readAt;
            const Wrapper = n.linkUrl ? Link : "div";
            const wrapperProps = n.linkUrl ? { href: n.linkUrl } : {};
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-2xl p-4 ring-1 transition-colors",
                  unread
                    ? "bg-accent/10 ring-accent/40"
                    : "bg-graphite-soft ring-graphite-line"
                )}
              >
                <Wrapper
                  {...(wrapperProps as { href: string })}
                  className="flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full",
                      unread ? "bg-accent" : "bg-transparent"
                    )}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-graphite px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper-dim">
                        {TYPE_LABEL[n.type]}
                      </span>
                      <span className="text-sm font-extrabold">{n.title}</span>
                    </div>
                    {n.body && <p className="text-sm text-paper-dim">{n.body}</p>}
                    <time className="text-xs text-paper-mute" dateTime={n.createdAt.toISOString()}>
                      {new Intl.DateTimeFormat("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(n.createdAt)}
                    </time>
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
