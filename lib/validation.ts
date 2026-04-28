import { z } from "zod";

export const roleEnum = z.enum(["ARTIST", "PROMOTER", "OFFICE"]);

export const signupSchema = z.object({
  email: z.string().email({ message: "Introduce un email válido" }),
  password: z
    .string()
    .min(10, { message: "Mínimo 10 caracteres" })
    .max(100)
    .regex(/[A-Z]/, { message: "Incluye al menos una mayúscula" })
    .regex(/[0-9]/, { message: "Incluye al menos un número" }),
  role: roleEnum,
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos" }),
  }),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Introduce un email válido" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z
    .string()
    .min(10, { message: "Mínimo 10 caracteres" })
    .max(100)
    .regex(/[A-Z]/, { message: "Incluye al menos una mayúscula" })
    .regex(/[0-9]/, { message: "Incluye al menos un número" }),
});

const urlOrEmptyOnboarding = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^https?:\/\//i.test(v), {
    message: "Debe empezar por http(s)://",
  });

export const performanceCategoryEnum = z.enum([
  "LIVE_MUSIC", "DJ", "COMEDY", "MAGIC", "ACTING", "DANCE_ACROBATICS", "KIDS",
]);

export const artistOnboardingSchema = z.object({
  stageName: z.string().min(2).max(80),
  category: performanceCategoryEnum.default("LIVE_MUSIC"),
  formatType: z.enum(["SOLO", "BAND", "DJ"]),
  baseCity: z.string().min(2).max(80),
  genres: z.array(z.string()).min(1, { message: "Elige al menos un género" }).max(5),
  bio: z.string().max(1200).optional().transform((v) => v?.trim() || null),
  spotifyUrl: urlOrEmptyOnboarding,
  youtubeUrl: urlOrEmptyOnboarding,
  instagramUrl: urlOrEmptyOnboarding,
  cacheMin: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  cacheMax: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  cachePublic: z.boolean().default(true),
  currency: z.string().length(3).default("EUR"),
  published: z.boolean().default(false),
}).refine(
  (d) => !(d.cacheMin && d.cacheMax) || d.cacheMin <= d.cacheMax,
  { message: "El caché mínimo no puede superar el máximo", path: ["cacheMin"] }
);
export type ArtistOnboardingInput = z.infer<typeof artistOnboardingSchema>;

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^https?:\/\//i.test(v), {
    message: "Debe empezar por http(s)://",
  });

export const artistProfileSchema = z.object({
  stageName: z.string().min(2).max(80),
  category: performanceCategoryEnum.optional().default("LIVE_MUSIC"),
  formatType: z.enum(["SOLO", "BAND", "DJ"]),
  baseCity: z.string().min(2).max(80),
  radiusKm: z.coerce.number().int().min(0).max(5000).default(150),
  bio: z.string().max(1200).optional().transform((v) => v?.trim() || null),
  genres: z.array(z.string()).min(1).max(8),
  cacheMin: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  cacheMax: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  currency: z.string().length(3).default("EUR"),
  cachePublic: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true"),
  spotifyUrl: urlOrEmpty,
  youtubeUrl: urlOrEmpty,
  instagramUrl: urlOrEmpty,
  soundcloudUrl: urlOrEmpty,
  published: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true"),
}).refine(
  (d) => !(d.cacheMin && d.cacheMax) || d.cacheMin <= d.cacheMax,
  { message: "Caché mínimo no puede superar el máximo", path: ["cacheMax"] }
);
export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;

export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  status: z.enum(["FREE", "TENTATIVE", "BLOCKED"]),
  note: z.string().max(200).optional().transform((v) => v?.trim() || null),
});
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const mediaMetaSchema = z.object({
  kind: z.enum(["PHOTO", "VIDEO", "TRACK"]),
  caption: z.string().max(120).optional().transform((v) => v?.trim() || null),
});

export const riderMetaSchema = z.object({
  kind: z.enum(["TECHNICAL", "HOSPITALITY", "STAGE_PLOT"]),
  label: z.string().min(2).max(120),
});

export const promoterProfileSchema = z.object({
  companyName: z.string().min(2).max(120),
  companyType: z.enum(["VENUE", "FESTIVAL", "AGENCY", "OFFICE"]),
  cif: z.string().max(30).optional().transform((v) => v?.trim() || null),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: "Email inválido",
    }),
  phone: z.string().max(40).optional().transform((v) => v?.trim() || null),
});
export type PromoterProfileInput = z.infer<typeof promoterProfileSchema>;

export const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  capacity: z.coerce.number().int().positive().max(200000),
  venueType: z.string().min(2).max(40).default("sala"),
  defaultGenres: z.array(z.string()).max(10).default([]),
});
export type VenueInput = z.infer<typeof venueSchema>;

export const proposalSchema = z.object({
  artistProfileId: z.string().min(1),
  venueId: z.string().optional().nullable().transform((v) => v || null),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  eventCity: z.string().min(2).max(80),
  venueName: z.string().min(2).max(120),
  budgetMin: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  budgetMax: z.coerce.number().int().min(0).max(1_000_000).optional().nullable(),
  currency: z.string().length(3).default("EUR"),
  slot: z.string().max(60).optional().transform((v) => v?.trim() || null),
  notes: z.string().min(20, "Cuenta un poco más (mín. 20 caracteres)").max(2000),
}).refine(
  (d) => !(d.budgetMin && d.budgetMax) || d.budgetMin <= d.budgetMax,
  { message: "Presupuesto mínimo no puede superar el máximo", path: ["budgetMax"] }
);
export type ProposalInput = z.infer<typeof proposalSchema>;

export const messageSchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().min(1, "Escribe algo").max(2000),
});
export type MessageInput = z.infer<typeof messageSchema>;

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(800).optional().transform((v) => v?.trim() || null),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const proposalStatusSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["ACCEPT", "REJECT", "BOOK", "CANCEL", "NEGOTIATE"]),
});

export const searchFiltersSchema = z.object({
  q: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  genre: z.string().max(40).optional(),
  formatType: z.enum(["SOLO", "BAND", "DJ"]).optional(),
  maxCache: z.coerce.number().int().min(0).max(500_000).optional(),
  availableOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const promoterOnboardingSchema = z.object({
  companyName: z.string().min(2).max(120),
  companyType: z.enum(["VENUE", "FESTIVAL", "AGENCY", "OFFICE"]),
  cif: z.string().optional().or(z.literal("")),
  venueName: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  capacity: z.coerce.number().int().positive().max(200000),
  preferredGenres: z.array(z.string()).min(1).max(8),
});
export type PromoterOnboardingInput = z.infer<typeof promoterOnboardingSchema>;

export const officeOnboardingSchema = z.object({
  companyName: z.string().min(2).max(120),
  cif: z.string().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: "Email inválido" }),
  rosterSlugs: z
    .array(z.string().trim().min(1).max(120))
    .max(10)
    .default([]),
});
export type OfficeOnboardingInput = z.infer<typeof officeOnboardingSchema>;
