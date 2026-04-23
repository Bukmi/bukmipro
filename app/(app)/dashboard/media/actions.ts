"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { mediaMetaSchema } from "@/lib/validation";
import { saveFile, StorageError, categorise } from "@/lib/storage";
import { computeCompleteness } from "@/lib/artist";

export type MediaState = { ok?: boolean; error?: string };

const KIND_TO_CATEGORY = {
  PHOTO: "image",
  VIDEO: "video",
  TRACK: "audio",
} as const;

export async function uploadMedia(
  _prev: MediaState,
  formData: FormData
): Promise<MediaState> {
  const { artist } = await requireArtist();

  const parsed = mediaMetaSchema.safeParse({
    kind: String(formData.get("kind") ?? ""),
    caption: String(formData.get("caption") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const expected = KIND_TO_CATEGORY[parsed.data.kind];
  const category = categorise(file.type);
  if (category !== expected) {
    return {
      error:
        parsed.data.kind === "PHOTO"
          ? "Sube una imagen (PNG, JPG, WebP o AVIF)."
          : parsed.data.kind === "VIDEO"
            ? "Sube un vídeo MP4 o WebM."
            : "Sube un audio (MP3, WAV, OGG).",
    };
  }

  try {
    const saved = await saveFile(file, `artist/${artist.id}/media`);
    const last = await prisma.media.findFirst({
      where: { artistProfileId: artist.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.media.create({
      data: {
        artistProfileId: artist.id,
        kind: parsed.data.kind,
        url: saved.url,
        caption: parsed.data.caption,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    await refreshCompleteness(artist.id);
    revalidatePath("/dashboard/media");
    revalidatePath(`/artista/${artist.slug}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof StorageError) return { error: err.message };
    console.error(err);
    return { error: "No se pudo guardar el archivo." };
  }
}

export async function deleteMedia(id: string): Promise<MediaState> {
  const { artist } = await requireArtist();
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || media.artistProfileId !== artist.id) {
    return { error: "Archivo no encontrado." };
  }
  await prisma.media.delete({ where: { id } });
  await refreshCompleteness(artist.id);
  revalidatePath("/dashboard/media");
  revalidatePath(`/artista/${artist.slug}`);
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
