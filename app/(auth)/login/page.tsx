import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 py-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Acceso</p>
        <h1 className="mt-3 text-hero">Bienvenido de vuelta.</h1>
        <p className="mt-3 text-paper-dim">Entra para continuar con tus bookings.</p>
      </header>
      <LoginForm />
    </div>
  );
}
