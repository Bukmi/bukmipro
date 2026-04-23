import { RecoverForm } from "./recover-form";

export const metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Acceso</p>
        <h1 className="text-hero">Recuperar contraseña</h1>
        <p className="text-paper-dim">
          Introduce tu email y te enviaremos un enlace para elegir una nueva contraseña.
        </p>
      </div>
      <RecoverForm />
    </section>
  );
}
