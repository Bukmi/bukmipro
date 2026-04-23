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

export const artistOnboardingSchema = z.object({
  stageName: z.string().min(2).max(80),
  formatType: z.enum(["SOLO", "BAND", "DJ"]),
  baseCity: z.string().min(2).max(80),
  genres: z.array(z.string()).min(1, { message: "Elige al menos un género" }).max(5),
});
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
  formatType: z.enum(["SOLO", "BAND", "DJ"]),
  baseCity: z.string().min(2).max(80),
  radiusKm: z.coerce.number().int().min(0).max(5000).default(150),
  bio: z.string().max(1200).optional().transform((v) => v?.trim() || null),
  genres: z.array(z.string()).min(1).max(8),
  cacheMin: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  cacheMax: z.coerce.number().int().min(0).max(500000).optional().nullable(),
  currency: z.string().length(3).default("EUR"),
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
