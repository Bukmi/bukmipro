# Bukmi — MVP

Plataforma que conecta artistas de live entertainment con promotoras, eliminando intermediarios.

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style UI + Prisma + PostgreSQL + NextAuth v5**.

## Entornos

| Entorno | Rama Git | URL | Base de datos | Stripe |
|---|---|---|---|---|
| **Local (dev)** | feature branches | `http://localhost:3000` | Supabase `Bukmi Pro` (compartido con staging) | dev-mode |
| **Staging** | `staging` | `https://staging.bukmi.pro` | Supabase `Bukmi Pro` | dev-mode |
| **Producción** | `main` | `https://bukmi.pro` | Supabase `Bukmi Prod` | dev-mode (por ahora) |

Flujo de trabajo:

1. Trabaja en ramas feature (`feat/...`) partiendo de `staging`.
2. PR a `staging` → deploy automático a `staging.bukmi.pro` para QA.
3. Cuando staging esté validado, PR de `staging` → `main` → deploy a `bukmi.pro`.

Las variables de entorno se gestionan en el dashboard de Vercel, con scope por entorno (Production / Preview / Development). Ver `.env.example` para la lista completa.

## Puesta en marcha local

1. **Dependencias** — `npm install`.
2. **Base de datos** — usa la connection string del pooler de Supabase (`Bukmi Pro`). Proyect Settings → Database → Connection string → URI (puerto 6543, con `?pgbouncer=true&connection_limit=1`).
3. **Variables de entorno** — copia `.env.example` a `.env.local` y rellena `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `AUTH_URL=http://localhost:3000` y `APP_URL=http://localhost:3000`.
4. **Schema y seeds** (solo la primera vez o tras cambios en `schema.prisma`):
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
