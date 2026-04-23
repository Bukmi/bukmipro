import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Payload = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
};

export async function pushNotification(payload: Payload) {
  if (!payload.userId) return;
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      linkUrl: payload.linkUrl ?? null,
    },
  });
}

export async function countUnread(userId: string) {
  if (!userId) return 0;
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
