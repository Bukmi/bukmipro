import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const PAGES: Record<string, { title: string; body: string }> = {
  terminos: {
    title: "Términos de servicio",
    body: "Placeholder de términos. Versión final en Sprint 5.",
  },
  privacidad: {
    title: "Política de privacidad",
    body: "Placeholder de privacidad. Versión final en Sprint 5.",
  },
  cookies: {
    title: "Política de cookies",
    body: "Placeholder de cookies. Versión final en Sprint 5.",
  },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  return { title: page?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-hero py-16">
        <h1 className="text-hero">{page.title}</h1>
        <p className="mt-6 text-paper-dim">{page.body}</p>
      </main>
      <SiteFooter />
    </>
  );
}
