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
  { href: "/dashboard/casting", label: "+ Nuevo Evento", Icon: CalendarPlus },
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
    <nav aria-label="Navegación de la promotora" className="flex flex-col gap-1">
      {items.map(({ href, label, Icon, badgeable }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
              active
                ? "bg-graphite-soft font-bold text-paper"
                : "text-paper-dim hover:bg-graphite-soft hover:text-paper"
            )}
          >
            <Icon aria-hidden className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {badgeable && unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} sin leer`}
                className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-graphite"
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
