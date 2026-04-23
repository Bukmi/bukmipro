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
