# Sifra - The Encrypted Ledger

## Overview

Sifra is a decentralized pay-to-read publishing platform built on the Kaspa blockchain ecosystem. Users connect the Kasware Wallet browser extension to browse articles and videos, pay to unlock premium content via real KAS transactions, and view author profiles. The platform uses KRC-20 token-based content monetization where authors publish articles or upload videos with teasers, and readers pay (in KAS tokens via Kasware) to decrypt/unlock full content. Anti-copy measures like watermarking are built into the UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: React Context for wallet state (`WalletProvider`), TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS custom properties for theming. Dark theme by default with a Kaspa-cyan (`#49EACB`) accent color. Fonts: Inter (sans), JetBrains Mono (mono)
- **Key Pages**:
  - `/` — Feed of articles and videos (post cards)
  - `/post/:id` — Article/video detail with pay-to-unlock
  - `/profile/:id` — User profile with tabs: Articles, Videos, Likes
  - `/new` — Create new article or upload video
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/posts` — List all posts with author data
  - `GET /api/posts/:id` — Single post (checks unlock status via wallet query param)
  - `POST /api/posts/:id/unlock` — Unlock a post (requires txId from Kasware transaction, increments unlock count)
  - `POST /api/auth/connect` — Wallet connection/login (registers wallet address from Kasware)
  - `GET /api/users/:id` — User profile with posts and earnings
- **Storage Layer**: `IStorage` interface implemented by `DatabaseStorage` class using Drizzle ORM queries. All database access goes through the `storage` singleton.
- **Seeding**: Automatic seed on startup if no users exist — creates mock authors, demo users, and sample articles

### Database
- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema** (in `shared/schema.ts`):
  - `users` — id (UUID), walletAddress (unique), name, bio, balance (integer, simulated KAS)
  - `posts` — id (UUID), authorId (FK to users), type (article|video), title, teaser, fullContent, videoUrl (nullable), price, unlocks count, likes count, perParagraphUnlock, createdAt
  - `unlocks` — id (UUID), userId (FK), postId (FK), unique constraint on (userId, postId)
  - `likes` — id (UUID), userId (FK), postId (FK), unique constraint on (userId, postId)
  - `paragraphUnlocks` — id (UUID), userId (FK), postId (FK), paragraphIndex, unique constraint on (userId, postId, paragraphIndex)
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database

### Build System
- **Development**: `npm run dev` — runs tsx with Vite dev server middleware (HMR via `server/vite.ts`)
- **Production Build**: `npm run build` — Vite builds the client to `dist/public/`, esbuild bundles the server to `dist/index.cjs`
- **Production Start**: `npm start` — runs the bundled server which serves static files

### Key Design Decisions
1. **Shared schema**: The `shared/` directory contains Drizzle schema and Zod types used by both client and server, ensuring type safety across the stack
2. **Kasware Wallet integration**: Real Kasware browser extension integration — wallet connects via `window.kasware.requestAccounts()`, payments use `window.kasware.sendKaspa()` to a hardcoded test address, and content unlocks when a valid txId is returned. TypeScript types for `window.kasware` are in `client/src/types/kasware.d.ts`.
3. **Anti-copy watermark**: Connected users see a transparent watermark overlay with their wallet address to discourage screenshots
4. **Content gating**: Full article content is stored server-side; the API only returns `fullContent` when the user has unlocked the post

## External Dependencies

- **PostgreSQL**: Required database, connection via `DATABASE_URL` environment variable. Uses `pg` driver with `connect-pg-simple` for potential session storage.
- **Google Fonts**: Inter and JetBrains Mono loaded from `fonts.googleapis.com`
- **Kasware Wallet Extension**: Required browser extension for wallet connection and KAS payments. Install from https://kasware.xyz
- **Replit plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, and `@replit/vite-plugin-dev-banner` used in development