import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta en Bukmi y empieza a cerrar shows sin intermediarios.",
};

type SearchParams = Promise<{ role?: string }>;
type Role = "ARTIST" | "PROMOTER" | "OFFICE";

function normaliseRole(raw: string | undefined): Role {
  if (raw === "PROMOTER" || raw === "ARTIST") return raw;
  return "ARTIST";
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { role } = await searchParams;
  const defaultRole = normaliseRole(role);

  return (
    <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.1fr]">
      <section aria-labelledby="signup-intro" className="flex flex-col gap-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Crear cuenta</p>
        <h1 id="signup-intro" className="text-hero">
          Empieza gratis. 14 días, sin tarjeta.
        </h1>
        <p className="text-paper-dim">
          Una sola plataforma para artistas y promotoras. Contratos, riders,
          disponibilidad y facturación en un solo sitio.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-paper-dim">
          <li>· Bio con IA en 60s, perfil público en minutos</li>
          <li>· Calendario y bandeja de solicitudes unificados</li>
          <li>· Firma digital y documentación versionada</li>
        </ul>
      </section>
      <section aria-labelledby="signup-form">
        <h2 id="signup-form" className="sr-only">
          Formulario de registro
        </h2>
        <SignupForm defaultRole={defaultRole} />
      </section>
    </div>
  );
}
