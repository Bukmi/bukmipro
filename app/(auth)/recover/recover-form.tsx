"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type RecoverState } from "./actions";

export function RecoverForm() {
  const [state, formAction, pending] = useActionState<RecoverState, FormData>(
    requestPasswordReset,
    {}
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-accent/15 p-4 text-sm">
          Si existe una cuenta asociada a <strong>{state.email}</strong>, hemos
          enviado un enlace para restablecer la contraseña. El enlace caduca en
          1 hora.
        </p>
        <Link href="/login" className="text-sm text-paper-dim hover:text-accent">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Field id="email" label="Email" required error={state?.fieldErrors?.email}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={state?.email}
          inputMode="email"
        />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>

      <Link href="/login" className="text-sm text-paper-dim hover:text-accent">
        Volver al inicio de sesión
      </Link>
    </form>
  );
}
