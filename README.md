# Bukmi — MVP

Plataforma que conecta artistas de live entertainment con promotoras, eliminando intermediarios.

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style UI + Prisma + PostgreSQL + NextAuth v5**.

## Puesta en marcha local

1. **Dependencias** — ya instaladas en `node_modules/` (`npm install` para reinstalar).
2. **Base de datos** — necesitas un PostgreSQL accesible. Opciones:
   - **Neon** (recomendado, gratis): crea un proyecto en https://neon.tech y copia la connection string.
   - Postgres local: `postgresql://user:pw@localhost:5432/bukmi`.
3. **Variables de entorno** — copia `.env.example` a `.env` y rellena `DATABASE_URL` y `AUTH_SECRET` (`openssl rand -base64 32`).
4. **Schema y seeds**:
   ```bash
   npm run db:push      # crea las tablas
   npm run db:seed      # 5 artistas + 3 promotoras ficticias
   ```
5. **Arranca**:
   ```bash
   npm run dev          # http://localhost:3000
   ```

## Credenciales de prueba (tras seed)

Contraseña común: `Bukmi1234!`

| Rol | Email |
|---|---|
| Artista | `rosalia.indie@bukmi.dev` |
| Artista | `nocturnos.band@bukmi.dev` |
| Artista | `dj.aurora@bukmi.dev` |
| Artista | `camino.flamenco@bukmi.dev` |
| Artista | `mara.trap@bukmi.dev` |
| Promotora | `apolo@bukmi.dev` |
| Promotora | `mad-cool@bukmi.dev` |
| Promotora | `kafe-antzokia@bukmi.dev` |

## Estructura

```
app/
  (auth)/           login, signup, verify-email, recover
  (app)/            layout autenticado + onboarding + dashboard
  legal/[slug]/     placeholders de términos, privacidad, cookies
  api/auth/         handler NextAuth
components/
  ui/               button, input, label, field, progress
  auth/             role-selector
  onboarding/       stepper, genre-picker
  site/             site-header, site-footer
lib/
  prisma.ts         cliente Prisma singleton
  validation.ts     schemas zod (signup, login, onboarding)
  email.ts          stub de email (Sprint 4: Resend)
  utils.ts          cn(), slugify()
prisma/
  schema.prisma     User, ArtistProfile, PromoterProfile, Venue + NextAuth
  seed.ts           seeds testing
auth.ts             configuración NextAuth v5
middleware.ts       protección de rutas + redirects onboarding
```

## Identidad visual

- Fondo `#1F1F1F` (`graphite`) · contenido `#F2F2F2` (`paper`) · acento `#E7FF52`.
- Tipografía Inter con pesos 700–800 para titulares (sans-serif bold, tono editorial).
- Foco siempre visible (`ring-2 ring-accent`), `prefers-reduced-motion` respetado.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build producción (`prisma generate` incluido)
- `npm run db:push` — sincroniza schema con la DB (dev)
- `npm run db:migrate` — crea migración
- `npm run db:seed` — siembra datos de prueba
- `npm run db:studio` — Prisma Studio
