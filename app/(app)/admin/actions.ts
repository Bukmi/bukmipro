"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session.user.id;
}

export async function toggleUserSuspended(userId: string) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "No autorizado." };
  if (userId === adminId) return { error: "No puedes suspenderte a ti mismo." };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedAt: true, role: true },
  });
  if (!target) return { error: "Usuario no encontrado." };
  if (target.role === "ADMIN") return { error: "No puedes suspender a otro admin." };

  await prisma.user.update({
    where: { id: userId },
    data: { suspendedAt: target.suspendedAt ? null : new Date() },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleReviewHidden(reviewId: string) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "No autorizado." };

  const review = await prisma.bookingReview.findUnique({
    where: { id: reviewId },
    select: {
      hiddenAt: true,
      booking: { select: { artistProfile: { select: { slug: true } } } },
    },
  });
  if (!review) return { error: "Valoración no encontrada." };

  await prisma.bookingReview.update({
    where: { id: reviewId },
    data: { hiddenAt: review.hiddenAt ? null : new Date() },
  });
  revalidatePath("/admin");
  if (review.booking.artistProfile.slug) {
    revalidatePath(`/artista/${review.booking.artistProfile.slug}`);
  }
  return { ok: true };
}

export async function toggleArtistPublished(artistId: string) {
  const adminId = await requireAdmin();
  if (!adminId) return { error: "No autorizado." };

  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
    select: { published: true, slug: true },
  });
  if (!artist) return { error: "Artista no encontrado." };

  await prisma.artistProfile.update({
    where: { id: artistId },
    data: { published: !artist.published },
  });
  revalidatePath("/admin");
  if (artist.slug) revalidatePath(`/artista/${artist.slug}`);
  return { ok: true };
}
