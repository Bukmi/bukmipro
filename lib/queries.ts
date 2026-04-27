/**
 * Cached Prisma queries for deduplicating identical fetches within the same
 * React render tree (e.g. generateMetadata + page component both reading the
 * same artist row).  React `cache()` scopes the memoisation to one request.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Full artist record for the public profile page (/artista/[slug]). */
export const getPublicArtistBySlug = cache(async (slug: string) => {
  return prisma.artistProfile.findUnique({
    where: { slug },
    include: {
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 12 },
      proposals: {
        where: {
          status: "BOOKED",
          reviews: { some: { perspective: "PROMOTER", hiddenAt: null } },
        },
        select: {
          id: true,
          eventDate: true,
          eventCity: true,
          venueName: true,
          promoter: { select: { companyName: true } },
          reviews: { where: { perspective: "PROMOTER", hiddenAt: null } },
        },
        orderBy: { eventDate: "desc" },
        take: 6,
      },
    },
  });
});

/** Artist record with media + upcoming availability for the promoter detail page. */
export const getArtistDetailBySlug = cache(async (slug: string) => {
  return prisma.artistProfile.findUnique({
    where: { slug },
    include: {
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 8 },
      availability: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 30,
      },
    },
  });
});
