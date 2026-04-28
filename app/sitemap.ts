import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { GENRE_SLUGS } from "@/lib/genres";

const SITE_URL = process.env.APP_URL ?? "https://bukmi.pro";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/precios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/signup`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const genreRoutes: MetadataRoute.Sitemap = GENRE_SLUGS.map(({ slug }) => ({
    url: `${SITE_URL}/generos/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const artists = await prisma.artistProfile
    .findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    })
    .catch(() => []);

  const artistRoutes: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${SITE_URL}/artista/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...genreRoutes, ...artistRoutes];
}
