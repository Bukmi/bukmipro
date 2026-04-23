import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Nueva contraseña" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    select: { expires: true, usedAt: true, purpose: true, userId: true },
  });

  const valid =
    record &&
    record.purpose === "PASSWORD_RESET" &&
    record.userId &&
    !record.usedAt &&
    record.expires > new Date();

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Acceso</p>
        <h1 className="text-hero">Nueva contraseña</h1>
        <p className="text-paper-dim">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <p role="alert" className="rounded-lg bg-danger/15 p-4 text-sm text-danger">
            Este enlace ya no es válido. Puede que haya caducado o que ya se haya
            utilizado.
          </p>
          <Link
            href="/recover"
            className="inline-flex w-fit items-center rounded-xl border border-graphite-line px-4 py-2 text-sm text-paper hover:border-accent hover:text-accent"
          >
            Solicitar otro enlace
          </Link>
        </div>
      )}
    </section>
  );
}
