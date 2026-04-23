"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/session";

export type RosterState = {
  ok?: boolean;
  error?: string;
};

const addSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  note: z.string().max(200).optional().transform((v) => v?.trim() || null),
});

export async function addRosterArtist(
  _prev: RosterState,
  formData: FormData
): Promise<RosterState> {
  const { session, promoter } = await requirePromoter();
  if (session.user.role !== "OFFICE") {
    return { error: "Solo disponible para cuentas de oficina." };
  }

  const parsed = addSchema.safeParse({
    slug: String(formData.get("slug") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Slug inválido." };
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { slug: parsed.data.slug.toLowerCase() },
    select: { id: true },
  });
  if (!artist) {
    return { error: "No encontramos ningún artista con ese slug." };
  }

  const existing = await prisma.artistRepresentation.findUnique({
    where: {
      promoterId_artistProfileId: {
        promoterId: promoter.id,
        artistProfileId: artist.id,
      },
    },
  });
  if (existing) {
    return { error: "Ese artista ya está en tu roster." };
  }

  await prisma.artistRepresentation.create({
    data: {
      promoterId: promoter.id,
      artistProfileId: artist.id,
      note: parsed.data.note,
    },
  });

  revalidatePath("/dashboard/oficina");
  return { ok: true };
}

export async function removeRosterArtist(id: string): Promise<RosterState> {
  const { session, promoter } = await requirePromoter();
  if (session.user.role !== "OFFICE") {
    return { error: "Solo disponible para cuentas de oficina." };
  }

  const rep = await prisma.artistRepresentation.findUnique({
    where: { id },
    select: { promoterId: true },
  });
  if (!rep || rep.promoterId !== promoter.id) {
    return { error: "Representación no encontrada." };
  }

  await prisma.artistRepresentation.delete({ where: { id } });
  revalidatePath("/dashboard/oficina");
  return { ok: true };
}
