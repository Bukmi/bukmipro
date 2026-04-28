"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePromoter } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { FormatType } from "@prisma/client";

const castingSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  venueName: z.string().min(2, "Indica el nombre del venue"),
  venueCity: z.string().min(2, "Indica la ciudad"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  formatType: z.enum(["SOLISTA", "DUO", "TRIO", "GRUPO", "COMPANIA", ""]).optional(),
  estimatedCache: z.coerce.number().int().min(0).optional().nullable(),
  description: z.string().optional(),
  applyDeadlineDays: z.coerce.number().int().min(1).max(30).default(3),
});

export type CastingState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function createCasting(
  _prev: CastingState,
  formData: FormData
): Promise<CastingState> {
  const { promoter } = await requirePromoter();

  const parsed = castingSchema.safeParse({
    title: formData.get("title"),
    venueName: formData.get("venueName"),
    venueCity: formData.get("venueCity"),
    eventDate: formData.get("eventDate"),
    formatType: formData.get("formatType") ?? "",
    estimatedCache: formData.get("estimatedCache") || null,
    description: formData.get("description"),
    applyDeadlineDays: formData.get("applyDeadlineDays") ?? 3,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  const { title, venueName, venueCity, eventDate, formatType, estimatedCache, description, applyDeadlineDays } = parsed.data;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + applyDeadlineDays);

  const casting = await prisma.castingCall.create({
    data: {
      promoterId: promoter.id,
      title,
      venueName,
      venueCity,
      eventDate: new Date(`${eventDate}T00:00:00.000Z`),
      formatType: (formatType || null) as FormatType | null,
      estimatedCache: estimatedCache ?? null,
      currency: "EUR",
      description: description || null,
      applyDeadline: deadline,
    },
  });

  redirect(`/dashboard/casting/${casting.id}`);
}
