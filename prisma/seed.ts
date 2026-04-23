import { PrismaClient, UserRole, FormatType, CompanyType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const ARTISTS = [
  {
    email: "rosalia.indie@bukmi.dev",
    stageName: "Rosalía Indie",
    baseCity: "Madrid",
    formatType: FormatType.SOLO,
    genres: ["Indie", "Pop", "Folk"],
    cacheMin: 1500,
    cacheMax: 3500,
    bio: "Cantautora indie con 4 años de carrera. Salas medianas y festivales emergentes.",
    spotifyUrl: "https://open.spotify.com/artist/ejemplo-rosalia-indie",
  },
  {
    email: "nocturnos.band@bukmi.dev",
    stageName: "Los Nocturnos",
    baseCity: "Barcelona",
    formatType: FormatType.BAND,
    genres: ["Rock", "Indie"],
    cacheMin: 2500,
    cacheMax: 5000,
    bio: "Cuarteto de rock alternativo catalán. 60+ bolos al año.",
    instagramUrl: "https://instagram.com/losnocturnos.demo",
  },
  {
    email: "dj.aurora@bukmi.dev",
    stageName: "DJ Aurora",
    baseCity: "Valencia",
    formatType: FormatType.DJ,
    genres: ["Electrónica", "R&B"],
    cacheMin: 900,
    cacheMax: 2200,
    bio: "Sets house y R&B reinterpretado para clubs medianos.",
    soundcloudUrl: "https://soundcloud.com/dj-aurora-demo",
  },
  {
    email: "camino.flamenco@bukmi.dev",
    stageName: "Camino Flamenco",
    baseCity: "Sevilla",
    formatType: FormatType.BAND,
    genres: ["Flamenco", "Jazz"],
    cacheMin: 3000,
    cacheMax: 7000,
    bio: "Formato quinteto, flamenco-jazz con base en Sevilla.",
    youtubeUrl: "https://youtube.com/@caminoflamenco-demo",
  },
  {
    email: "mara.trap@bukmi.dev",
    stageName: "Mara Trap",
    baseCity: "Bilbao",
    formatType: FormatType.SOLO,
    genres: ["Trap", "Hip-Hop"],
    cacheMin: 1200,
    cacheMax: 2800,
    bio: "MC y productora. Festivales urbanos y salas de 300–600 pax.",
    spotifyUrl: "https://open.spotify.com/artist/ejemplo-mara-trap",
  },
];

const PROMOTERS = [
  {
    email: "apolo@bukmi.dev",
    companyName: "Sala Apolo",
    companyType: CompanyType.VENUE,
    cif: "B08123456",
    venues: [{ name: "Sala Apolo", city: "Barcelona", capacity: 600, defaultGenres: ["Indie", "Electrónica"] }],
  },
  {
    email: "mad-cool@bukmi.dev",
    companyName: "Mad Cool Booking",
    companyType: CompanyType.FESTIVAL,
    cif: "B28999111",
    venues: [{ name: "Mad Cool Festival", city: "Madrid", capacity: 60000, defaultGenres: ["Rock", "Pop", "Electrónica"] }],
  },
  {
    email: "kafe-antzokia@bukmi.dev",
    companyName: "Kafe Antzokia Bookings",
    companyType: CompanyType.AGENCY,
    cif: "A48222333",
    venues: [{ name: "Kafe Antzokia", city: "Bilbao", capacity: 500, defaultGenres: ["Rock", "Hip-Hop", "Trap"] }],
  },
];

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash("Bukmi1234!", 12);

  for (const a of ARTISTS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash,
        role: UserRole.ARTIST,
        emailVerifiedAt: now,
        onboardingStatus: "COMPLETED",
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.artistProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        stageName: a.stageName,
        slug: slugify(a.stageName),
        bio: a.bio,
        baseCity: a.baseCity,
        formatType: a.formatType,
        genres: a.genres,
        cacheMin: a.cacheMin,
        cacheMax: a.cacheMax,
        spotifyUrl: a.spotifyUrl,
        youtubeUrl: a.youtubeUrl,
        instagramUrl: a.instagramUrl,
        soundcloudUrl: a.soundcloudUrl,
        completenessScore: 70,
        published: true,
      },
    });
  }

  for (const p of PROMOTERS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash,
        role: UserRole.PROMOTER,
        emailVerifiedAt: now,
        onboardingStatus: "COMPLETED",
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    const promoter = await prisma.promoterProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: p.companyName,
        companyType: p.companyType,
        cif: p.cif,
        verified: true,
      },
    });
    for (const v of p.venues) {
      const exists = await prisma.venue.findFirst({
        where: { promoterId: promoter.id, name: v.name },
        select: { id: true },
      });
      if (!exists) {
        await prisma.venue.create({
          data: {
            promoterId: promoter.id,
            name: v.name,
            city: v.city,
            capacity: v.capacity,
            defaultGenres: v.defaultGenres,
          },
        });
      }
    }
  }

  console.log(`✓ Seeded ${ARTISTS.length} artistas y ${PROMOTERS.length} promotoras`);
  console.log("  Contraseña común para testing: Bukmi1234!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
