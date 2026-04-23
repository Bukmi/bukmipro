"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function markAllRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notificaciones");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markOneRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado." };
  const n = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true, readAt: true },
  });
  if (!n || n.userId !== session.user.id) return { error: "No encontrada." };
  if (!n.readAt) {
    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
  revalidatePath("/dashboard/notificaciones");
  return { ok: true };
}
