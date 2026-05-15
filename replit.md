# Tilawah Assistant

A Quran recitation assistant app for listening to and tracking Quran recitation sessions, with community features, bookmarks, and memorization tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/tilawah-web run dev` — run the frontend (dev, port 18994)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v3 + wouter
- API: Express 5 with express-session + connect-pg-simple
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: bcryptjs + express-session
- Audio: Alafasy recitations (served from `public/audio/alafasy/`)
- i18n: Arabic/English bilingual support

## Where things live

- `artifacts/tilawah-web/` — React frontend (previewPath: `/`)
- `artifacts/api-server/` — Express backend (previewPath: `/api`)
- `lib/db/src/schema/schema.ts` — Drizzle schema (all tables)
- `artifacts/api-server/src/routes/routes.ts` — All API routes
- `artifacts/api-server/src/storage.ts` — Data access layer
- `artifacts/api-server/src/auth.ts` — Auth middleware + handlers
- `artifacts/tilawah-web/src/lib/queryClient.ts` — Custom fetch layer
- `artifacts/tilawah-web/public/audio/` — Symlink to `.migration-backup/public/audio/`

## Architecture decisions

- OpenAPI spec intentionally kept minimal — the app uses a custom fetch layer (`queryClient.ts`) rather than generated hooks, which avoids risky rewrites of 20+ pages
- Audio files (1.6GB) are symlinked from `.migration-backup/public/audio/` rather than copied
- DB connection is in `lib/db` (node-postgres Pool), re-exported by `artifacts/api-server/src/db.ts`
- Session store uses `connect-pg-simple` with the same pool as Drizzle
- `registerRoutes(app)` is called from `index.ts` before `app.listen()` to set up session middleware and all routes

## Product

- **Dashboard** — recitation stats, recent activity, quick navigation
- **Recite** — Surah selector, ayah-by-ayah audio playback with pause controls
- **Communities** — create/join Quran completion groups, juz assignments
- **Bookmarks** — save and annotate individual ayahs
- **Memorization** — heatmap and calendar tracking of practice sessions
- **History** — past recitation sessions
- **Search** — full-text search over Arabic text and translations
- **Bilingual** — full Arabic/English UI toggle

## User preferences

- TypeScript errors are out of scope for the port task — use `@ts-ignore` as needed
- Functionality and visual parity matter more than zero TS errors

## Gotchas

- Audio symlink must exist: `artifacts/tilawah-web/public/audio → .migration-backup/public/audio`
- Tailwind v3 (postcss) used in frontend, NOT @tailwindcss/vite
- `server.fs.strict: false` required in vite.config.ts for attached_assets alias
- `registerRoutes` is async and must be awaited before `app.listen()`
- Session secret defaults to a dev value; set `SESSION_SECRET` env var in production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
