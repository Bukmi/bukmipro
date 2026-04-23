"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { riderMetaSchema } from "@/lib/validation";
import { saveFile, StorageError, categorise } from "@/lib/storage";
import { computeCompleteness } from "@/lib/artist";

export type RiderState = { ok?: boolean; error?: string };

export async function uploadRider(
  _prev: RiderState,
  formData: FormData
): Promise<RiderState> {
  const { artist } = await requireArtist();

  const parsed = riderMetaSchema.safeParse({
    kind: String(formData.get("kind") ?? ""),
    label: String(formData.get("label") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un PDF." };
  }
  if (categorise(file.type) !== "document") {
    return { error: "Solo PDF por ahora." };
  }

  try {
    const saved = await saveFile(file, `artist/${artist.id}/riders`);
    const previous = await prisma.rider.findFirst({
      where: { artistProfileId: artist.id, kind: parsed.data.kind },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    await prisma.rider.create({
      data: {
        artistProfileId: artist.id,
        kind: parsed.data.kind,
        label: parsed.data.label,
        url: saved.url,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        version: (previous?.version ?? 0) + 1,
      },
    });
    await refreshCompleteness(artist.id);
    revalidatePath("/dashboard/riders");
    return { ok: true };
  } catch (err) {
    if (err instanceof StorageError) return { error: err.message };
    console.error(err);
    return { error: "No se pudo guardar el PDF." };
  }
}

export async function deleteRider(id: string): Promise<RiderState> {
  const { artist } = await requireArtist();
  const rider = await prisma.rider.findUnique({ where: { id } });
  if (!rider || rider.artistProfileId !== artist.id) {
    return { error: "Rider no encontrado." };
  }
  await prisma.rider.delete({ where: { id } });
  await refreshCompleteness(artist.id);
  revalidatePath("/dashboard/riders");
  return { ok: true };
}

async function refreshCompleteness(artistId: string) {
  const [profile, mediaCount, ridersCount] = await Promise.all([
    prisma.artistProfile.findUnique({ where: { id: artistId } }),
    prisma.media.count({ where: { artistProfileId: artistId } }),
    prisma.rider.count({ where: { artistProfileId: artistId } }),
  ]);
  if (!profile) return;
  const score = computeCompleteness({ ...profile, mediaCount, ridersCount });
  await prisma.artistProfile.update({
    where: { id: artistId },
    data: { completenessScore: score },
  });
}
