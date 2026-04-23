"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Field
        id="email"
        label="Email"
        required
        error={state?.fieldErrors?.email}
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={state?.email}
          inputMode="email"
        />
      </Field>

      <Field id="password" label="Contraseña" required error={state?.fieldErrors?.password}>
        <Input type="password" name="password" autoComplete="current-password" />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Entrando…" : "Iniciar sesión"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/recover" className="text-paper-dim hover:text-accent">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href="/signup" className="font-bold text-paper underline hover:text-accent">
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
