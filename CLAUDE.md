# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server (port 3000, hot reload)
npm run build    # TypeScript compile + Vite production build
npm run preview  # Preview production build locally
```

## Architecture

**Stack**: React 19 + TypeScript + Vite + Tailwind CSS + Firebase (Auth + Firestore)

### Key Directories
- `src/pages/` - Full-screen route components (Dashboard, Analytics, Settings, Login)
- `src/components/` - Reusable UI components
- `src/services/` - Firebase SDK init (`firebase.ts`) and Firestore CRUD (`firestore.ts`)
- `src/hooks/` - Custom hooks (`useAuth.ts` for Firebase auth state)
- `src/utils/` - Date formatting, currency, week calculations
- `src/types/` - TypeScript interfaces

### Data Flow
Firestore listeners (`onSnapshot`) → React state → UI re-render. All writes go through `firestore.ts` service functions.

### Routing
React Router with 4 routes: `/` (Dashboard), `/analytics`, `/settings`, `/login`. Auth-gated in `App.tsx`.

## Firestore Data Model

**User isolation**: All collections filter by `userId` field.

| Collection | Key Fields |
|------------|------------|
| `expenses` | amount, category ('Alltag'/'Sonderposten'), description, date (Timestamp) |
| `fixedCosts` | name, amount, yearMonth (YYYYMM as number), paidMonths (array) |
| `incomes` | name, amount, yearMonth |
| `keywordFilters` | keyword, createdAt |

**Month encoding**: Uses `YYYYMM` as number (e.g., `202601` for January 2026).

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## Deployment

GitHub Actions (`.github/workflows/firebase-hosting.yml`) auto-deploys on push to `main`. Secrets stored in GitHub, injected as `.env` during build. Output in `dist/` deployed to Firebase Hosting.

## Code Conventions

- **Language**: German for UI text, variable names, and comments
- **Locale**: de-DE formatting for dates and currency (EUR)
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind with glassmorphism patterns (backdrop-blur, gradients)

## PWA

Configured via `vite-plugin-pwa`. Service worker handles caching:
- Firebase API: NetworkFirst (7 days)
- Google Fonts: CacheFirst (1 year)
- Auto-updates in background
