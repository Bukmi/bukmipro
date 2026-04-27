"use server";

import { revalidatePath } from "next/cache";
import { requireArtist, requirePromoter } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pushNotification } from "@/lib/notifications";

export type ActionState = { ok?: boolean; error?: string };

// Artist applies to a casting call
export async function applyToCasting(
  castingCallId: string,
  message: string
): Promise<ActionState> {
  const { artist, session } = await requireArtist();

  const casting = await prisma.castingCall.findUnique({
    where: { id: castingCallId },
    select: { id: true, status: true, applyDeadline: true, title: true, promoterId: true, promoter: { select: { userId: true } } },
  });

  if (!casting || casting.status !== "OPEN") return { error: "Este evento ya no acepta candidaturas." };
  if (new Date() > casting.applyDeadline) return { error: "El plazo de aplicación ha terminado." };

  const existing = await prisma.castingApplication.findUnique({
    where: { castingCallId_artistProfileId: { castingCallId, artistProfileId: artist.id } },
  });
  if (existing) return { error: "Ya has aplicado a este evento." };

  await prisma.castingApplication.create({
    data: { castingCallId, artistProfileId: artist.id, message: message || null },
  });

  // Notify promoter
  await pushNotification({
    userId: casting.promoter.userId,
    type: "PROPOSAL_CREATED",
    title: "Nueva candidatura",
    body: `Un artista ha aplicado a tu evento "${casting.title}".`,
    linkUrl: `/dashboard/casting/${castingCallId}`,
  });

  revalidatePath(`/dashboard/casting/${castingCallId}`);
  return { ok: true };
}

// Promoter selects one application (accepts it, rejects the rest)
export async function selectApplication(
  castingCallId: string,
  applicationId: string
): Promise<ActionState> {
  const { promoter } = await requirePromoter();

  const casting = await prisma.castingCall.findUnique({
    where: { id: castingCallId },
    select: { id: true, promoterId: true, title: true, applications: { select: { id: true, artistProfileId: true, artistProfile: { select: { userId: true, stageName: true } } } } },
  });

  if (!casting || casting.promoterId !== promoter.id) return { error: "No tienes acceso a este evento." };

  const chosen = casting.applications.find((a) => a.id === applicationId);
  if (!chosen) return { error: "Candidatura no encontrada." };

  // Accept chosen, reject others
  await prisma.$transaction([
    prisma.castingApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    }),
    prisma.castingApplication.updateMany({
      where: { castingCallId, id: { not: applicationId } },
      data: { status: "REJECTED" },
    }),
    prisma.castingCall.update({
      where: { id: castingCallId },
      data: { status: "CLOSED" },
    }),
  ]);

  // Notify accepted artist
  await pushNotification({
    userId: chosen.artistProfile.userId,
    type: "PROPOSAL_STATUS",
    title: "¡Seleccionado!",
    body: `Has sido seleccionado para el evento "${casting.title}". La promotora se pondrá en contacto contigo.`,
    linkUrl: `/dashboard/casting/${castingCallId}`,
  });

  // Notify rejected artists
  const rejected = casting.applications.filter((a) => a.id !== applicationId);
  await Promise.all(
    rejected.map((a) =>
      pushNotification({
        userId: a.artistProfile.userId,
        type: "PROPOSAL_STATUS",
        title: "Candidatura no seleccionada",
        body: `La promotora ha seleccionado otro artista para "${casting.title}".`,
        linkUrl: `/dashboard/casting/${castingCallId}`,
      })
    )
  );

  revalidatePath(`/dashboard/casting/${castingCallId}`);
  return { ok: true };
}

// Promoter closes casting manually
export async function closeCasting(castingCallId: string): Promise<ActionState> {
  const { promoter } = await requirePromoter();

  const casting = await prisma.castingCall.findUnique({
    where: { id: castingCallId },
    select: { promoterId: true },
  });
  if (!casting || casting.promoterId !== promoter.id) return { error: "No tienes acceso a este evento." };

  await prisma.castingCall.update({
    where: { id: castingCallId },
    data: { status: "CLOSED" },
  });

  revalidatePath(`/dashboard/casting/${castingCallId}`);
  return { ok: true };
}
