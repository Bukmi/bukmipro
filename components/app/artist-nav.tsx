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
  BarChart3,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/perfil", label: "Mi perfil", Icon: User },
  { href: "/dashboard/calendario", label: "Disponibilidad", Icon: Calendar },
  { href: "/dashboard/media", label: "Media", Icon: ImageIcon },
  { href: "/dashboard/riders", label: "Riders", Icon: FileText },
  { href: "/dashboard/propuestas", label: "Propuestas", Icon: Inbox },
  { href: "/dashboard/analiticas", label: "Analíticas", Icon: BarChart3 },
  { href: "/dashboard/facturacion", label: "Facturación", Icon: CreditCard },
];

export function ArtistNav({ publicSlug }: { publicSlug?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación del artista" className="flex flex-col gap-1">
      {items.map(({ href, label, Icon }) => {
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
            {label}
          </Link>
        );
      })}
      {publicSlug && (
        <Link
          href={`/artista/${publicSlug}`}
          target="_blank"
          rel="noopener"
          className="mt-4 flex items-center gap-3 rounded-xl border border-graphite-line px-3 py-2 text-sm text-paper-dim hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
        >
          <Eye aria-hidden className="h-4 w-4" />
          Ver perfil público
        </Link>
      )}
    </nav>
  );
}
