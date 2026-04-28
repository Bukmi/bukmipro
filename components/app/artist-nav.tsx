"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Calendar,
  Image as ImageIcon,
  FileText,
  Eye,
  Inbox,
  Megaphone,
  BarChart3,
  CreditCard,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/perfil", label: "Mi perfil", Icon: User },
  { href: "/dashboard/calendario", label: "Disponibilidad", Icon: Calendar },
  { href: "/dashboard/media", label: "Media", Icon: ImageIcon },
  { href: "/dashboard/riders", label: "Riders", Icon: FileText },
  { href: "/dashboard/propuestas", label: "Propuestas", Icon: Inbox },
  { href: "/dashboard/casting", label: "Propuestas Abiertas", Icon: Megaphone },
  { href: "/dashboard/notificaciones", label: "Notificaciones", Icon: Bell, badgeable: true as const },
  { href: "/dashboard/analiticas", label: "Analíticas", Icon: BarChart3 },
  { href: "/dashboard/facturacion", label: "Facturación", Icon: CreditCard },
];

export function ArtistNav({ publicSlug, unreadCount = 0 }: { publicSlug?: string; unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación del artista"
      className="scrollbar-none flex overflow-x-auto gap-1 pb-2 border-b border-graphite-line lg:flex-col lg:overflow-visible lg:pb-0 lg:border-b-0 lg:gap-1"
    >
      {items.map((item) => {
        const { href, label, Icon } = item;
        const badgeable = "badgeable" in item && item.badgeable;
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center rounded-xl transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
              // Mobile: compact icon + small label stacked
              "flex-col gap-1 shrink-0 min-w-[60px] px-2 py-2 text-[10px] font-medium",
              // Desktop: horizontal icon + label
              "lg:flex-row lg:gap-3 lg:min-w-0 lg:px-3 lg:py-2 lg:text-sm lg:font-normal",
              active
                ? "bg-graphite-soft font-bold text-paper"
                : "text-paper-dim hover:bg-graphite-soft hover:text-paper"
            )}
          >
            <Icon aria-hidden className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
            <span className="w-full truncate text-center lg:flex-1 lg:text-left lg:w-auto">{label}</span>
            {badgeable && unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} sin leer`}
                className="absolute top-1 right-1 rounded-full bg-accent px-1 py-0.5 text-[8px] font-bold leading-none text-graphite lg:static lg:px-1.5 lg:py-0.5 lg:text-[10px]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
      {publicSlug && (
        <Link
          href={`/artista/${publicSlug}`}
          target="_blank"
          rel="noopener"
          className={cn(
            "flex items-center rounded-xl border border-graphite-line transition-colors",
            "hover:border-accent hover:text-accent text-paper-dim",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
            // Mobile: compact
            "flex-col gap-1 shrink-0 min-w-[60px] px-2 py-2 text-[10px]",
            // Desktop: horizontal
            "lg:flex-row lg:gap-3 lg:min-w-0 lg:mt-4 lg:px-3 lg:py-2 lg:text-sm"
          )}
        >
          <Eye aria-hidden className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
          <span className="w-full truncate text-center lg:flex-1 lg:text-left lg:w-auto">Ver perfil</span>
        </Link>
      )}
    </nav>
  );
}
