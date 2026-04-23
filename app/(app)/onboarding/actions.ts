"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  artistOnboardingSchema,
  promoterOnboardingSchema,
} from "@/lib/validation";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function completeArtistOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await requireUser();
  if (user.role !== "ARTIST") {
    return { error: "Este onboarding es solo para cuentas de artista." };
  }

  const raw = {
    stageName: String(formData.get("stageName") ?? "").trim(),
    formatType: String(formData.get("formatType") ?? "SOLO"),
    baseCity: String(formData.get("baseCity") ?? "").trim(),
    genres: formData.getAll("genres").map(String).filter(Boolean),
  };

  const parsed = artistOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: "Revisa los campos.", fieldErrors };
  }

  const baseSlug = slugify(parsed.data.stageName);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.artistProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${++n}`;
  }

  await prisma.artistProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stageName: parsed.data.stageName,
      slug,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
      completenessScore: 35,
    },
    update: {
      stageName: parsed.data.stageName,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function completePromoterOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await requireUser();
  if (user.role !== "PROMOTER" && user.role !== "OFFICE") {
    return { error: "Este onboarding es solo para cuentas de promotora u oficina." };
  }

  const raw = {
    companyName: String(formData.get("companyName") ?? "").trim(),
    companyType: String(formData.get("companyType") ?? "VENUE"),
    cif: String(formData.get("cif") ?? "").trim(),
    venueName: String(formData.get("venueName") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    capacity: String(formData.get("capacity") ?? "0"),
    preferredGenres: formData.getAll("preferredGenres").map(String).filter(Boolean),
  };

  const parsed = promoterOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: "Revisa los campos.", fieldErrors };
  }

  const promoter = await prisma.promoterProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: parsed.data.companyName,
      companyType: parsed.data.companyType,
      cif: parsed.data.cif || null,
    },
    update: {
      companyName: parsed.data.companyName,
      companyType: parsed.data.companyType,
      cif: parsed.data.cif || null,
    },
  });

  const existingVenue = await prisma.venue.findFirst({
    where: { promoterId: promoter.id, name: parsed.data.venueName },
    select: { id: true },
  });
  if (!existingVenue) {
    await prisma.venue.create({
      data: {
        promoterId: promoter.id,
        name: parsed.data.venueName,
        city: parsed.data.city,
        capacity: parsed.data.capacity,
        defaultGenres: parsed.data.preferredGenres,
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
