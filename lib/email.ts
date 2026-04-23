// Email stub para Sprint 1. Sprint 4 integra Resend.
// En dev imprime el link de verificación en consola.

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`\n[Bukmi] Email de verificación para ${to}:\n  ${verifyUrl}\n`);
    return { ok: true, mocked: true as const };
  }
  // TODO(sprint-4): implementar con Resend
  return { ok: true, mocked: false as const };
}
