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
    formatType: FormatType.SOLISTA,
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
    formatType: FormatType.GRUPO,
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
    formatType: FormatType.SOLISTA,
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
    formatType: FormatType.GRUPO,
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
    formatType: FormatType.SOLISTA,
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

  await seedProposals(now);
  await seedOfficeRoster(now, passwordHash);
  await seedAdmin(now, passwordHash);

  console.log(`✓ Seeded ${ARTISTS.length} artistas y ${PROMOTERS.length} promotoras`);
  console.log("  Contraseña común para testing: Bukmi1234!");
}

async function seedOfficeRoster(now: Date, passwordHash: string) {
  const officeEmail = "office@bukmi.dev";
  const user = await prisma.user.upsert({
    where: { email: officeEmail },
    update: {},
    create: {
      email: officeEmail,
      passwordHash,
      role: UserRole.OFFICE,
      emailVerifiedAt: now,
      onboardingStatus: "COMPLETED",
      trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  const office = await prisma.promoterProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      companyName: "Bukmi Office Demo",
      companyType: CompanyType.OFFICE,
      verified: true,
    },
  });

  const rosterEmails = [
    "rosalia.indie@bukmi.dev",
    "nocturnos.band@bukmi.dev",
    "mara.trap@bukmi.dev",
  ];
  for (const email of rosterEmails) {
    const artist = await prisma.artistProfile.findFirst({
      where: { user: { email } },
      select: { id: true },
    });
    if (!artist) continue;
    await prisma.artistRepresentation.upsert({
      where: {
        promoterId_artistProfileId: {
          promoterId: office.id,
          artistProfileId: artist.id,
        },
      },
      update: {},
      create: {
        promoterId: office.id,
        artistProfileId: artist.id,
        note: "Roster demo de oficina",
      },
    });
  }
}

async function seedAdmin(now: Date, passwordHash: string) {
  await prisma.user.upsert({
    where: { email: "admin@bukmi.dev" },
    update: {},
    create: {
      email: "admin@bukmi.dev",
      passwordHash,
      role: UserRole.ADMIN,
      emailVerifiedAt: now,
      onboardingStatus: "COMPLETED",
    },
  });
}

async function seedProposals(now: Date) {
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const inTwoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const inThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const apolo = await prisma.promoterProfile.findFirst({
    where: { user: { email: "apolo@bukmi.dev" } },
    include: { venues: true, user: true },
  });
  const madCool = await prisma.promoterProfile.findFirst({
    where: { user: { email: "mad-cool@bukmi.dev" } },
    include: { venues: true, user: true },
  });
  const kafe = await prisma.promoterProfile.findFirst({
    where: { user: { email: "kafe-antzokia@bukmi.dev" } },
    include: { venues: true, user: true },
  });

  const rosalia = await prisma.artistProfile.findFirst({
    where: { user: { email: "rosalia.indie@bukmi.dev" } },
    include: { user: true },
  });
  const nocturnos = await prisma.artistProfile.findFirst({
    where: { user: { email: "nocturnos.band@bukmi.dev" } },
    include: { user: true },
  });
  const mara = await prisma.artistProfile.findFirst({
    where: { user: { email: "mara.trap@bukmi.dev" } },
    include: { user: true },
  });

  if (!apolo || !madCool || !kafe || !rosalia || !nocturnos || !mara) return;

  const fixtures = [
    {
      promoter: apolo,
      artist: rosalia,
      eventDate: toDateOnly(inAMonth),
      status: "INQUIRY" as const,
      venueName: "Sala Apolo",
      eventCity: "Barcelona",
      budgetMin: 2000,
      budgetMax: 3000,
      slot: "22:30 - 00:00",
      notes:
        "Hola Rosalía, querríamos reservar la sala 2 para una noche indie. Abrimos a las 22 y el público suele ser de 350-400 personas.",
      messages: [] as { sender: "PROMOTER" | "ARTIST" | "SYSTEM"; body: string }[],
    },
    {
      promoter: madCool,
      artist: nocturnos,
      eventDate: toDateOnly(inTwoMonths),
      status: "NEGOTIATING" as const,
      venueName: "Mad Cool Festival",
      eventCity: "Madrid",
      budgetMin: 4000,
      budgetMax: 5500,
      slot: "19:00",
      notes:
        "Tenemos un hueco en el escenario Loop. Busco rock alternativo en horario early evening.",
      messages: [
        { sender: "ARTIST" as const, body: "Genial, podríamos cerrar si hay backline completo y alojamiento para 4 personas." },
      ],
    },
    {
      promoter: kafe,
      artist: mara,
      eventDate: toDateOnly(inThreeMonths),
      status: "BOOKED" as const,
      venueName: "Kafe Antzokia",
      eventCity: "Bilbao",
      budgetMin: 1500,
      budgetMax: 2000,
      notes:
        "Fecha cerrada para gira urbana. Apertura con DJ local 21:30, directo 22:30.",
      messages: [
        { sender: "ARTIST" as const, body: "Perfecto, confirmamos. Os paso el rider técnico." },
        { sender: "PROMOTER" as const, body: "Recibido. Bloqueamos fecha y pasamos contrato." },
      ],
    },
  ];

  for (const f of fixtures) {
    const exists = await prisma.bookingRequest.findFirst({
      where: {
        promoterId: f.promoter.id,
        artistProfileId: f.artist.id,
        eventDate: f.eventDate,
      },
      select: { id: true },
    });
    if (exists) continue;

    const booking = await prisma.bookingRequest.create({
      data: {
        promoterId: f.promoter.id,
        artistProfileId: f.artist.id,
        venueId: f.promoter.venues[0]?.id,
        eventDate: f.eventDate,
        eventCity: f.eventCity,
        venueName: f.venueName,
        budgetMin: f.budgetMin,
        budgetMax: f.budgetMax,
        slot: f.slot,
        notes: f.notes,
        status: f.status,
        lastActivityAt: now,
        messages: {
          create: [
            {
              sender: "PROMOTER",
              authorUserId: f.promoter.userId,
              body: f.notes,
            },
            ...f.messages.map((m) => ({
              sender: m.sender,
              authorUserId:
                m.sender === "ARTIST" ? f.artist.userId : m.sender === "PROMOTER" ? f.promoter.userId : null,
              body: m.body,
            })),
          ],
        },
      },
    });

    if (f.status === "BOOKED") {
      await prisma.availability.upsert({
        where: {
          artistProfileId_date: { artistProfileId: f.artist.id, date: f.eventDate },
        },
        create: {
          artistProfileId: f.artist.id,
          date: f.eventDate,
          status: "BOOKED",
          note: `Booking ${booking.id}`,
        },
        update: { status: "BOOKED" },
      });

      await prisma.bookingReview.upsert({
        where: { bookingId_perspective: { bookingId: booking.id, perspective: "PROMOTER" } },
        create: {
          bookingId: booking.id,
          perspective: "PROMOTER",
          authorUserId: f.promoter.userId,
          rating: 5,
          body: "Show redondo, muy profesional, puntualidad y público entregado.",
        },
        update: {},
      });
    }
  }
}

function toDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
