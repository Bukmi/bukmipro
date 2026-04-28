"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
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

export async function skipOnboarding() {
  const user = await requireUser();
  if (user.role !== "ARTIST") redirect("/dashboard");

  // Derive a starter slug from the email local part
  const emailLocal = user.email?.split("@")[0] ?? "artista";
  const baseSlug = slugify(emailLocal);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.artistProfile.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${++n}`;
  }

  // Create a minimal profile (not published, score 0) only if none exists yet
  await prisma.artistProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stageName: emailLocal,
      slug,
      formatType: "SOLISTA",
      category: "LIVE_MUSIC",
      completenessScore: 0,
      published: false,
    },
    update: {}, // don't overwrite an existing in-progress profile
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  // Fuerza refresco del JWT para que el middleware vea onboardingStatus: COMPLETED
  await unstable_update({});

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

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
    category: String(formData.get("category") ?? "LIVE_MUSIC"),
    formatType: String(formData.get("formatType") ?? "SOLISTA"),
    baseCity: String(formData.get("baseCity") ?? "").trim(),
    genres: formData.getAll("genres").map(String).filter(Boolean),
    bio: String(formData.get("bio") ?? ""),
    spotifyUrl: String(formData.get("spotifyUrl") ?? ""),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    cacheMin: String(formData.get("cacheMin") ?? "") || null,
    cacheMax: String(formData.get("cacheMax") ?? "") || null,
    cachePublic: formData.get("cachePublic") !== null,
    currency: String(formData.get("currency") ?? "EUR"),
    published: formData.get("published") !== null,
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
    bio: parsed.data.bio ?? null,
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
      category: parsed.data.category,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
      bio: parsed.data.bio ?? null,
      spotifyUrl: parsed.data.spotifyUrl ?? null,
      youtubeUrl: parsed.data.youtubeUrl ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      cachePublic: parsed.data.cachePublic,
      currency: parsed.data.currency,
      published: parsed.data.published,
      completenessScore,
    },
    update: {
      stageName: parsed.data.stageName,
      category: parsed.data.category,
      formatType: parsed.data.formatType,
      baseCity: parsed.data.baseCity,
      genres: parsed.data.genres,
      bio: parsed.data.bio ?? null,
      spotifyUrl: parsed.data.spotifyUrl ?? null,
      youtubeUrl: parsed.data.youtubeUrl ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      cachePublic: parsed.data.cachePublic,
      currency: parsed.data.currency,
      published: parsed.data.published,
      completenessScore,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStatus: "COMPLETED" },
  });

  await unstable_update({});

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

  await unstable_update({});

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

  await unstable_update({});

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
