"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";

export type ResetState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function resetPassword(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const raw = {
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: "Revisa la contraseña.", fieldErrors };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
    select: { id: true, userId: true, expires: true, usedAt: true, purpose: true },
  });

  if (
    !record ||
    record.purpose !== "PASSWORD_RESET" ||
    !record.userId ||
    record.usedAt ||
    record.expires < new Date()
  ) {
    return { error: "El enlace ya no es válido. Solicita uno nuevo." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
