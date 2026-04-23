import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verificar email" };

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <section className="mx-auto max-w-md rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line">
        <h1 className="text-hero">Revisa tu email</h1>
        <p className="mt-4 text-paper-dim">
          Te hemos enviado un enlace para verificar tu cuenta. Si no aparece,
          revisa la carpeta de spam.
        </p>
      </section>
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  const now = new Date();
  const valid = record && record.expires > now;

  if (!valid) {
    return (
      <section className="mx-auto max-w-md rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line">
        <h1 className="text-hero">Enlace no válido</h1>
        <p className="mt-4 text-paper-dim">
          Este enlace ha caducado o ya se usó. Solicita uno nuevo desde el
          registro.
        </p>
        <Button asChild variant="secondary" className="mt-8">
          <Link href="/signup">Volver al registro</Link>
        </Button>
      </section>
    );
  }

  await prisma.user.update({
    where: { id: record.userId ?? undefined },
    data: { emailVerifiedAt: now },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line">
      <h1 className="text-hero">Email verificado</h1>
      <p className="mt-4 text-paper-dim">
        Ya puedes iniciar sesión y completar tu onboarding.
      </p>
      <Button asChild className="mt-8">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    </section>
  );
}
