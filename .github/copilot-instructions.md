# Cashplan - Finance Tracking PWA

## Tech Stack
- React 19 + TypeScript + Vite
- Firebase (Auth + Firestore) with offline persistence
- Tailwind CSS with glassmorphism design
- PWA via vite-plugin-pwa

## Key Architecture
- **User Isolation**: All Firestore collections filtered by `userId`
- **Month Encoding**: YYYYMM as number (e.g., 202601)
- **Data Flow**: Firestore listeners → React state → UI
- **Auth**: Firebase Auth with `AuthContext` provider

## Core Collections
- `expenses`: amount, category ('Alltag'/'Sonderposten'), description, date
- `fixedCosts`: name, amount, yearMonth, paidMonths, interval
- `incomes`: name, amount, yearMonth
- `keywordFilters`: keyword for expense filtering
- `expenseAreas`: name, keywords[], color for categorization

## Development Workflow
```bash
npm run dev      # Vite dev server (port 3000)
npm run build    # TypeScript + Vite build
npm run preview  # Preview production build
```

## Code Patterns
- **AutocompleteInput**: Portal-based dropdown with fuzzy matching (accent-insensitive)
- **Area Matching**: Expenses auto-categorized by keywords in `expenseAreas`
- **Collapsible Sections**: State-managed with summary in header
- **Error Handling**: Try/catch on all Firestore ops with `onError` callbacks

## Conventions
- German UI text, de-DE locale for dates/currency (EUR)
- Functional components with hooks
- Strict TypeScript
- Glassmorphism: `backdrop-blur`, transparent backgrounds
- Responsive design with mobile-first approach

## Deployment
- GitHub Actions auto-deploys to Firebase Hosting on push to main
- Environment variables injected during build
- PWA with NetworkFirst caching for Firebase, CacheFirst for fonts

## Key Files
- `src/services/firestore.ts`: All CRUD operations
- `src/utils/areaMatching.ts`: Expense categorization logic
- `src/components/AutocompleteInput.tsx`: Fuzzy search dropdown
- `src/contexts/AuthContext.tsx`: Auth state management