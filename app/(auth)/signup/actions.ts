"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/email";

export type SignupState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
    acceptTerms: formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors, email: raw.email };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      error: "Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?",
      email: raw.email,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      trialEndsAt,
    },
    select: { id: true, email: true },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires, userId: user.id },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, verifyUrl);

  return { ok: true, email: user.email };
}
