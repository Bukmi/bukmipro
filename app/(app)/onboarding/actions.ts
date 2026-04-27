"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { computeCompleteness } from "@/lib/artist";
import {
  artistOnboardingSchema,
  officeOnboardingSchema,
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
    spotifyUrl: String(formData.get("spotifyUrl") ?? ""),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    cacheMin: String(formData.get("cacheMin") ?? "") || null,
    cacheMax: String(formData.get("cacheMax") ?? "") || null,
    currency: String(formData.get("currency") ?? "EUR"),
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

  const completenessScore = computeCompleteness({
    bio: null,
    baseCity: parsed.data.baseCity,
    genres: parsed.data.genres,
    cacheMin: parsed.data.cacheMin ?? null,
    cacheMax: parsed.data.cacheMax ?? null,
    spotifyUrl: parsed.data.spotifyUrl ?? null,
    youtubeUrl: parsed.data.youtubeUrl ?? null,
    instagramUrl: parsed.data.instagramUrl ?? null,
    soundcloudUrl: null,
    mediaCount: 0,
    ridersCount: 0,
  });

  await prisma.artistProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stageName: parsed.data.stageName,
      slug,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
      spotifyUrl: parsed.data.spotifyUrl ?? null,
      youtubeUrl: parsed.data.youtubeUrl ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      currency: parsed.data.currency,
      completenessScore,
    },
    update: {
      stageName: parsed.data.stageName,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
      spotifyUrl: parsed.data.spotifyUrl ?? null,
      youtubeUrl: parsed.data.youtubeUrl ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      currency: parsed.data.currency,
      completenessScore,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  revalidatePath("/dashboard");
  redirect("/onboarding/bienvenida");
}

export async function completeOfficeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await requireUser();
  if (user.role !== "OFFICE") {
    return { error: "Este onboarding es solo para cuentas de oficina." };
  }

  const raw = {
    companyName: String(formData.get("companyName") ?? "").trim(),
    cif: String(formData.get("cif") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    rosterSlugs: formData
      .getAll("rosterSlugs")
      .map((v) => String(v).toLowerCase().trim())
      .filter(Boolean),
  };

  const parsed = officeOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: "Revisa los campos.", fieldErrors };
  }

  const office = await prisma.promoterProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: parsed.data.companyName,
      companyType: "OFFICE",
      cif: parsed.data.cif || null,
      contactEmail: parsed.data.contactEmail,
    },
    update: {
      companyName: parsed.data.companyName,
      companyType: "OFFICE",
      cif: parsed.data.cif || null,
      contactEmail: parsed.data.contactEmail,
    },
  });

  const unknownSlugs: string[] = [];
  for (const slug of parsed.data.rosterSlugs) {
    const artist = await prisma.artistProfile.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!artist) {
      unknownSlugs.push(slug);
      continue;
    }
    await prisma.artistRepresentation.upsert({
      where: {
        promoterId_artistProfileId: {
          promoterId: office.id,
          artistProfileId: artist.id,
        },
      },
      update: {},
      create: { promoterId: office.id, artistProfileId: artist.id },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  revalidatePath("/dashboard");
  if (unknownSlugs.length > 0) {
    return {
      error: `No encontramos artistas para: ${unknownSlugs.join(", ")}. El resto se ha añadido.`,
    };
  }
  redirect("/dashboard/oficina");
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
