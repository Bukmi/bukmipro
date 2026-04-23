"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: "Revisa los campos.", fieldErrors, email: raw.email };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: "Email o contraseña incorrectos.",
        email: raw.email,
      };
    }
    throw err;
  }
  return {};
}
