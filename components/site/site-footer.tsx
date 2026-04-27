import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-graphite-line py-10">
      <div className="container-hero flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-paper-dim">
          © {new Date().getFullYear()} Bukmi · Matching directo entre artistas y quien programa
        </p>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-6 text-sm">
          <Link href="/legal/terminos" className="hover:text-accent">Términos</Link>
          <Link href="/legal/privacidad" className="hover:text-accent">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:text-accent">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
