"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { artistProfileSchema } from "@/lib/validation";
import { computeCompleteness } from "@/lib/artist";

export type SaveArtistState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveArtistProfile(
  _prev: SaveArtistState,
  formData: FormData
): Promise<SaveArtistState> {
  const { artist } = await requireArtist();

  const raw = {
    stageName: String(formData.get("stageName") ?? ""),
    category: String(formData.get("category") ?? "LIVE_MUSIC"),
    formatType: String(formData.get("formatType") ?? "SOLO"),
    baseCity: String(formData.get("baseCity") ?? ""),
    radiusKm: String(formData.get("radiusKm") ?? "150"),
    bio: String(formData.get("bio") ?? ""),
    genres: formData.getAll("genres").map(String).filter(Boolean),
    cacheMin: String(formData.get("cacheMin") ?? "") || null,
    cacheMax: String(formData.get("cacheMax") ?? "") || null,
    cachePublic: formData.get("cachePublic") !== null,
    currency: String(formData.get("currency") ?? "EUR"),
    spotifyUrl: String(formData.get("spotifyUrl") ?? ""),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    soundcloudUrl: String(formData.get("soundcloudUrl") ?? ""),
    published: formData.get("published"),
  };

  const parsed = artistProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  const [mediaCount, ridersCount] = await Promise.all([
    prisma.media.count({ where: { artistProfileId: artist.id } }),
    prisma.rider.count({ where: { artistProfileId: artist.id } }),
  ]);

  const completenessScore = computeCompleteness({
    bio: parsed.data.bio ?? null,
    baseCity: parsed.data.baseCity,
    genres: parsed.data.genres,
    cacheMin: parsed.data.cacheMin ?? null,
    cacheMax: parsed.data.cacheMax ?? null,
    spotifyUrl: parsed.data.spotifyUrl ?? null,
    youtubeUrl: parsed.data.youtubeUrl ?? null,
    instagramUrl: parsed.data.instagramUrl ?? null,
    soundcloudUrl: parsed.data.soundcloudUrl ?? null,
    mediaCount,
    ridersCount,
  });

  await prisma.artistProfile.update({
    where: { id: artist.id },
    data: {
      stageName: parsed.data.stageName,
      category: parsed.data.category,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      radiusKm: parsed.data.radiusKm,
      bio: parsed.data.bio,
      genres: parsed.data.genres,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      cachePublic: parsed.data.cachePublic,
      currency: parsed.data.currency,
      spotifyUrl: parsed.data.spotifyUrl ?? null,
      youtubeUrl: parsed.data.youtubeUrl ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      soundcloudUrl: parsed.data.soundcloudUrl ?? null,
      published: parsed.data.published,
      completenessScore,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath(`/artista/${artist.slug}`);
  return { ok: true };
}
