import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="container-hero flex h-16 items-center">
        <Link
          href="/"
          aria-label="Bukmi — ir al inicio"
          className="inline-flex items-center gap-2"
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center rounded-full border-2 border-paper px-3 py-1 text-sm font-extrabold tracking-tight"
          >
            bukmi.pro
          </span>
        </Link>
      </header>
      <main id="main" className="container-hero py-10">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
