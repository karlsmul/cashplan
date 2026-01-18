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
- `src/contexts/` - React Context providers (AuthContext)
- `src/services/` - Firebase SDK init (`firebase.ts`) and Firestore CRUD (`firestore.ts`)
- `src/utils/` - Date formatting, currency, week calculations
- `src/types/` - TypeScript interfaces

### Data Flow
Firestore listeners (`onSnapshot`) → React state → UI re-render. All writes go through `firestore.ts` service functions with error handling.

### Auth Architecture
`AuthContext` wraps the app (in `main.tsx`), providing a single auth listener. Use `useAuth()` hook from `contexts/AuthContext` in components.

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

**Offline-Persistenz**: Aktiviert via `enableIndexedDbPersistence()` in `firebase.ts`.

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
- **Error Handling**: All Firestore operations wrapped in try/catch, subscribe functions have optional `onError` callback

## PWA

Configured via `vite-plugin-pwa`. Service worker handles caching:
- Firebase API: NetworkFirst (7 days)
- Google Fonts: CacheFirst (1 year)
- Auto-updates in background

---

## Projekt-Backup (Stand: 18. Januar 2026)

### Aktuelle Features

#### 1. Ausgabenverwaltung (Dashboard)
- Ausgaben erfassen mit Betrag, Datum, Kategorie (Alltag/Sonderposten), Beschreibung
- **AutocompleteInput**: Dropdown mit Vorschlägen basierend auf bisherigen Ausgaben
  - React Portal für korrektes Z-Index-Verhalten
  - Fuzzy-Matching (Akzent-insensitiv: "cafe" = "Café")
  - Tastaturnavigation (Pfeiltasten, Enter, Escape)
- Fixkosten mit Wiederholungsintervall (monatlich, einmalig)
- Einnahmen pro Monat

#### 2. Analytics-Seite
- Monats- und Jahresübersicht
- Keyword-Filter zum Ausblenden bestimmter Ausgaben
- **Bereichs-basierte Statistik** (NEU):
  - Benutzerdefinierte Bereiche (z.B. "Lebensmittel", "Transport")
  - Keywords pro Bereich (z.B. "REWE", "Edeka" → Lebensmittel)
  - Automatische Zuordnung von Ausgaben zu Bereichen
  - Monatsstatistik pro Bereich mit Farbcodierung
  - Jahresübersicht: Summen pro Bereich pro Monat

#### 3. Einstellungen
- Wahl zwischen Cloud- und lokaler Speicherung
- Info-Seite zur Datenspeicherung

### Firestore Collections

| Collection | Key Fields |
|------------|------------|
| `expenses` | amount, category, description, date, userId |
| `fixedCosts` | name, amount, yearMonth, paidMonths, interval ('monthly'/'once') |
| `incomes` | name, amount, yearMonth, userId |
| `keywordFilters` | keyword, userId, createdAt |
| `userSettings` | storageType ('cloud'/'local'), userId |
| `expenseAreas` | name, keywords[], color, priority, userId, createdAt |

### Komponenten-Struktur

```
src/
├── components/
│   ├── AutocompleteInput.tsx   # Dropdown mit Fuzzy-Matching & Portal
│   ├── AreaManager.tsx         # Bereiche verwalten (CRUD)
│   ├── AreaMonthlyStats.tsx    # Monatsstatistik nach Bereichen
│   ├── AreaYearlyStats.tsx     # Jahresübersicht nach Bereichen
│   ├── ExpenseForm.tsx         # Ausgabe erfassen
│   ├── ExpenseList.tsx         # Ausgabenliste
│   ├── FixedCostManager.tsx    # Fixkosten verwalten
│   └── IncomeManager.tsx       # Einnahmen verwalten
├── pages/
│   ├── Dashboard.tsx           # Hauptseite mit Ausgabenerfassung
│   ├── Analytics.tsx           # Statistiken & Bereiche
│   ├── Settings.tsx            # Einstellungen
│   └── Login.tsx               # Authentifizierung
├── contexts/
│   └── AuthContext.tsx         # Firebase Auth State
├── services/
│   ├── firebase.ts             # Firebase Init
│   └── firestore.ts            # Alle Firestore CRUD-Operationen
├── utils/
│   ├── areaMatching.ts         # Bereichs-Matching & Statistik-Berechnung
│   └── dateUtils.ts            # Datum/Währungsformatierung
└── types/
    └── index.ts                # TypeScript Interfaces
```

### Wichtige Utility-Funktionen

**areaMatching.ts:**
- `normalizeForMatching(text)` - Akzent-insensitive Normalisierung
- `matchExpenseToArea(expense, areas)` - Ordnet Ausgabe einem Bereich zu
- `groupExpensesByArea(expenses, areas)` - Gruppiert alle Ausgaben
- `calculateMonthlyAreaStats(expenses, areas, yearMonth)` - Monatsstatistik
- `calculateYearlyAreaStats(expenses, areas, year)` - Jahresstatistik

### Design-System

- **Farbschema**: Dark Mode mit Purple/Pink Gradienten
- **Glassmorphism**: `backdrop-blur`, transparente Hintergründe
- **Bereichsfarben**: Vordefinierte Palette in `AREA_COLORS`
  - Grün (#22c55e), Blau (#3b82f6), Lila (#a855f7), Rosa (#ec4899)
  - Orange (#f97316), Türkis (#14b8a6), Gelb (#eab308), Rot (#ef4444)

### Bekannte technische Details

1. **Portal für Dropdowns**: AutocompleteInput nutzt `ReactDOM.createPortal` um das Dropdown direkt in `document.body` zu rendern. Das verhindert Z-Index-Probleme.

2. **Viewport-Koordinaten**: Bei `position: fixed` werden `getBoundingClientRect()` Werte direkt verwendet (NICHT `+ window.scrollY`).

3. **Fuzzy-Matching**: Unicode-Normalisierung (NFD) + Regex entfernt diakritische Zeichen für akzent-insensitive Suche.

### Deployment

- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions auf Push zu `main`
- **Firestore Rules**: In `firestore.rules` - manuelles Deploy via `firebase deploy --only firestore:rules`

### Nächste mögliche Features

- [ ] Export/Import von Daten
- [ ] Budgets pro Bereich setzen
- [ ] Wiederkehrende Ausgaben
- [ ] Diagramme/Charts für Visualisierung
