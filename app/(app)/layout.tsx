import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site/site-footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <>
      <header className="border-b border-graphite-line bg-graphite">
        <div className="container-hero flex h-16 items-center justify-between">
          <Link href="/" aria-label="Bukmi">
            <span
              aria-hidden
              className="inline-flex items-center justify-center rounded-full border-2 border-paper px-3 py-1 text-sm font-extrabold tracking-tight"
            >
              bukmi.pro
            </span>
          </Link>
          {session && (
            <div className="flex items-center gap-2">
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-full border border-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent hover:bg-accent hover:text-graphite"
                >
                  Admin
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Cerrar sesión
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main id="main" className="container-hero py-10">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
