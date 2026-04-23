"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireArtist } from "@/lib/session";
import { availabilitySchema } from "@/lib/validation";

export type CalendarState = { ok?: boolean; error?: string };

export async function setAvailability(
  _prev: CalendarState,
  formData: FormData
): Promise<CalendarState> {
  const { artist } = await requireArtist();
  const parsed = availabilitySchema.safeParse({
    date: String(formData.get("date") ?? ""),
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);

  if (parsed.data.status === "FREE") {
    await prisma.availability.deleteMany({
      where: { artistProfileId: artist.id, date },
    });
  } else {
    await prisma.availability.upsert({
      where: {
        artistProfileId_date: { artistProfileId: artist.id, date },
      },
      create: {
        artistProfileId: artist.id,
        date,
        status: parsed.data.status,
        note: parsed.data.note,
      },
      update: { status: parsed.data.status, note: parsed.data.note },
    });
  }

  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
