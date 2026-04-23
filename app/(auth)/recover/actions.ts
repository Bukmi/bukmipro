"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

export type RecoverState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

export async function requestPasswordReset(
  _prev: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: "Revisa el campo.", fieldErrors, email: raw.email };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, suspendedAt: true },
  });

  if (user && !user.suspendedAt) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
        purpose: "PASSWORD_RESET",
        userId: user.id,
      },
    });
    const baseUrl = process.env.AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(user.email, `${baseUrl}/reset-password/${token}`);
  }

  return { ok: true, email: parsed.data.email };
}
