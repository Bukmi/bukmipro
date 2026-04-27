"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "@/components/auth/role-selector";
import { signupAction, type SignupState } from "./actions";

type Role = "ARTIST" | "PROMOTER" | "OFFICE";

export function SignupForm({ defaultRole }: { defaultRole: Role }) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    {}
  );

  if (state?.ok) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl bg-graphite-soft p-8 ring-1 ring-graphite-line"
      >
        <h2 className="text-hero">Revisa tu email</h2>
        <p className="mt-4 text-paper-dim">
          Hemos enviado un enlace de verificación a{" "}
          <strong className="text-paper">{state.email}</strong>. Abre el enlace
          para activar tu cuenta y continuar con el onboarding.
        </p>
        <p className="mt-4 text-xs text-paper-mute">
          En desarrollo, el enlace aparece también en la consola del servidor.
        </p>
        <Button asChild variant="secondary" className="mt-8">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6" aria-describedby="signup-status">
      <div id="signup-status" className="sr-only" aria-live="polite">
        {state?.error ?? ""}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend id="role-legend" className="text-sm font-semibold">¿Cómo vas a usar Bukmi?</legend>
        <p id="role-hint" className="text-xs text-paper-dim">
          Podrás cambiarlo más adelante desde Ajustes.
        </p>
        <RoleSelector
          name="role"
          value={role}
          onValueChange={setRole}
          aria-labelledby="role-legend"
          aria-describedby="role-hint"
        />
      </fieldset>

      <Field
        id="email"
        label="Email"
        required
        error={state?.fieldErrors?.email}
        hint="Usaremos este email para las comunicaciones de booking."
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={state?.email}
          inputMode="email"
        />
      </Field>

      <Field
        id="password"
        label="Contraseña"
        required
        error={state?.fieldErrors?.password}
        hint="Mínimo 10 caracteres, una mayúscula y un número."
      >
        <Input type="password" name="password" autoComplete="new-password" minLength={10} />
      </Field>

      <div className="flex items-start gap-3">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-graphite-line bg-graphite-soft accent-accent"
        />
        <label htmlFor="acceptTerms" className="text-sm text-paper-dim">
          Acepto los{" "}
          <Link href="/legal/terminos" className="underline hover:text-accent">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad" className="underline hover:text-accent">
            política de privacidad
          </Link>
          .
        </label>
      </div>
      {state?.fieldErrors?.acceptTerms && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {state.fieldErrors.acceptTerms}
        </p>
      )}

      {state?.error && !state.fieldErrors && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-paper-dim">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-paper underline hover:text-accent">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
