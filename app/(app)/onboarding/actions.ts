"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { computeCompleteness } from "@/lib/artist";
import { canPublishProfile, planStatus } from "@/lib/plan";
import { parseSpotifyArtistId, fetchSpotifyArtist, type SpotifyArtist } from "@/lib/spotify";
import { enrichBio } from "@/lib/bio-enrichment";
import { suggestCache } from "@/lib/cache-calculator";
import {
  artistOnboardingSchema,
  officeOnboardingSchema,
  promoterOnboardingSchema,
} from "@/lib/validation";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Spotify import action
// ---------------------------------------------------------------------------

export type SpotifyImportResult =
  | { ok: true; artist: SpotifyArtist; bio: string; bioSource: string | null; cacheMin: number | null; cacheMax: number | null }
  | { ok: false; error: string };

export async function importFromSpotify(
  _prev: SpotifyImportResult | null,
  formData: FormData
): Promise<SpotifyImportResult> {
  const url = String(formData.get("spotifyUrl") ?? "").trim();
  if (!url) return { ok: false, error: "Introduce tu URL de Spotify." };

  const artistId = parseSpotifyArtistId(url);
  if (!artistId) {
    return {
      ok: false,
      error: "URL no reconocida. Usa el enlace de tu perfil de artista en Spotify.",
    };
  }

  let artist: SpotifyArtist | null;
  try {
    artist = await fetchSpotifyArtist(artistId);
  } catch {
    return { ok: false, error: "No pudimos conectar con Spotify. Inténtalo de nuevo." };
  }

  if (!artist) {
    return { ok: false, error: "No encontramos ese artista en Spotify. Revisa la URL." };
  }

  // Bio enrichment and cache suggestion run in parallel
  const [bioResult, cacheSuggestion] = await Promise.all([
    enrichBio(artist.name),
    Promise.resolve(suggestCache(artist.followers)),
  ]);

  return {
    ok: true,
    artist,
    bio: bioResult.bio,
    bioSource: bioResult.source,
    cacheMin: cacheSuggestion?.min ?? null,
    cacheMax: cacheSuggestion?.max ?? null,
  };
}

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

  // Fuerza refresco del JWT — redirigimos a /bienvenida (bajo /onboarding, no /dashboard)
  // para evitar la race condition del JWT con el middleware.
  await unstable_update({});

  revalidatePath("/dashboard");
  redirect("/onboarding/bienvenida");
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
    tikTokUrl: String(formData.get("tikTokUrl") ?? ""),
    bandsintownUrl: String(formData.get("bandsintownUrl") ?? ""),
    cacheMin: String(formData.get("cacheMin") ?? "") || null,
    cacheMax: String(formData.get("cacheMax") ?? "") || null,
    cachePublic: formData.get("cachePublic") !== null,
    currency: String(formData.get("currency") ?? "EUR"),
    published: formData.get("published") !== null,
    spotifyArtistId: String(formData.get("spotifyArtistId") ?? "") || null,
    spotifyFollowers: String(formData.get("spotifyFollowers") ?? "") || null,
    spotifyTopTrackId: String(formData.get("spotifyTopTrackId") ?? "") || null,
  };

  const parsed = artistOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: "Revisa los campos.", fieldErrors };
  }

  // Plan gate: silently downgrade published to false if plan not active
  if (parsed.data.published) {
    const userPlan = await prisma.user.findUnique({
      where: { id: user.id },
      select: { planCode: true, subscriptionStatus: true, trialEndsAt: true },
    });
    if (!userPlan || !canPublishProfile(planStatus(userPlan))) {
      parsed.data.published = false;
    }
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

  const socialSyncedAt =
    parsed.data.spotifyArtistId ? new Date() : undefined;

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
      tikTokUrl: parsed.data.tikTokUrl ?? null,
      bandsintownUrl: parsed.data.bandsintownUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      cachePublic: parsed.data.cachePublic,
      currency: parsed.data.currency,
      published: parsed.data.published,
      completenessScore,
      spotifyArtistId: parsed.data.spotifyArtistId ?? null,
      spotifyFollowers: parsed.data.spotifyFollowers ?? null,
      spotifyTopTrackId: parsed.data.spotifyTopTrackId ?? null,
      socialSyncedAt,
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
      tikTokUrl: parsed.data.tikTokUrl ?? null,
      bandsintownUrl: parsed.data.bandsintownUrl ?? null,
      cacheMin: parsed.data.cacheMin ?? null,
      cacheMax: parsed.data.cacheMax ?? null,
      cachePublic: parsed.data.cachePublic,
      currency: parsed.data.currency,
      published: parsed.data.published,
      completenessScore,
      ...(parsed.data.spotifyArtistId && {
        spotifyArtistId: parsed.data.spotifyArtistId,
        spotifyFollowers: parsed.data.spotifyFollowers ?? null,
        spotifyTopTrackId: parsed.data.spotifyTopTrackId ?? null,
        socialSyncedAt,
      }),
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
  redirect("/onboarding/bienvenida-promotora");
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
  redirect("/onboarding/bienvenida-promotora");
}
