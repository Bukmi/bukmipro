"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/session";
import { promoterProfileSchema, venueSchema } from "@/lib/validation";

export type EmpresaState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function savePromoter(
  _prev: EmpresaState,
  formData: FormData
): Promise<EmpresaState> {
  const { promoter } = await requirePromoter();

  const parsed = promoterProfileSchema.safeParse({
    companyName: String(formData.get("companyName") ?? ""),
    companyType: String(formData.get("companyType") ?? ""),
    cif: String(formData.get("cif") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  await prisma.promoterProfile.update({
    where: { id: promoter.id },
    data: parsed.data,
  });

  revalidatePath("/dashboard/empresa");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveVenue(
  _prev: EmpresaState,
  formData: FormData
): Promise<EmpresaState> {
  const { promoter } = await requirePromoter();

  const rawGenres = formData.getAll("defaultGenres").map(String).filter(Boolean);
  const parsed = venueSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    city: String(formData.get("city") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    venueType: String(formData.get("venueType") ?? "sala"),
    defaultGenres: rawGenres,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  if (parsed.data.id) {
    const venue = await prisma.venue.findUnique({ where: { id: parsed.data.id } });
    if (!venue || venue.promoterId !== promoter.id) {
      return { error: "Venue no encontrado." };
    }
    await prisma.venue.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        capacity: parsed.data.capacity,
        venueType: parsed.data.venueType,
        defaultGenres: parsed.data.defaultGenres,
      },
    });
  } else {
    await prisma.venue.create({
      data: {
        promoterId: promoter.id,
        name: parsed.data.name,
        city: parsed.data.city,
        capacity: parsed.data.capacity,
        venueType: parsed.data.venueType,
        defaultGenres: parsed.data.defaultGenres,
      },
    });
  }

  revalidatePath("/dashboard/empresa");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteVenue(id: string): Promise<EmpresaState> {
  const { promoter } = await requirePromoter();
  const venue = await prisma.venue.findUnique({
    where: { id },
    select: { promoterId: true, _count: { select: { proposals: true } } },
  });
  if (!venue || venue.promoterId !== promoter.id) {
    return { error: "Venue no encontrado." };
  }
  if (venue._count.proposals > 0) {
    return { error: "No se puede eliminar: tiene propuestas asociadas." };
  }
  await prisma.venue.delete({ where: { id } });
  revalidatePath("/dashboard/empresa");
  return { ok: true };
}
