import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-graphite-line bg-graphite">
      <div className="container-hero flex h-16 items-center justify-between">
        <Link
          href="/"
          aria-label="Bukmi — ir al inicio"
          className="inline-flex items-center gap-2"
        >
          <span
            className="inline-flex items-center justify-center rounded-full border-2 border-paper px-3 py-1 text-sm font-extrabold tracking-tight"
            aria-hidden
          >
            bukmi.pro
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Crear cuenta</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
