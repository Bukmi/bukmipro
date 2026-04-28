"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  CalendarPlus,
  Inbox,
  Building2,
  BarChart3,
  Users2,
  CreditCard,
  Bell,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  badgeable?: boolean;
};

const baseItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/buscar", label: "Buscar artistas", Icon: Search },
  { href: "/dashboard/casting", label: "Nuevo Evento", Icon: CalendarPlus },
  { href: "/dashboard/propuestas", label: "Mis propuestas", Icon: Inbox },
  { href: "/dashboard/notificaciones", label: "Notificaciones", Icon: Bell, badgeable: true },
  { href: "/dashboard/analiticas", label: "Analíticas", Icon: BarChart3 },
  { href: "/dashboard/empresa", label: "Empresa y venues", Icon: Building2 },
  { href: "/dashboard/facturacion", label: "Facturación", Icon: CreditCard },
];

const officeItem: NavItem = { href: "/dashboard/oficina", label: "Roster oficina", Icon: Users2 };

export function PromoterNav({ role, unreadCount = 0 }: { role: UserRole; unreadCount?: number }) {
  const pathname = usePathname();
  const items = role === "OFFICE" ? [...baseItems, officeItem] : baseItems;
  return (
    <nav
      aria-label="Navegación de la promotora"
      className="scrollbar-none flex overflow-x-auto gap-1 pb-2 border-b border-graphite-line lg:flex-col lg:overflow-visible lg:pb-0 lg:border-b-0 lg:gap-1"
    >
      {items.map(({ href, label, Icon, badgeable }) => {
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
    </nav>
  );
}
