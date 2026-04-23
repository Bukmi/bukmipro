"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { resetPassword, type ResetState } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    {}
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-accent/15 p-4 text-sm">
          Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-bold text-graphite hover:opacity-90"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="token" value={token} />

      <Field
        id="password"
        label="Nueva contraseña"
        required
        hint="Mínimo 10 caracteres, con mayúscula y número."
        error={state?.fieldErrors?.password}
      >
        <Input
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={10}
        />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </Button>
    </form>
  );
}
