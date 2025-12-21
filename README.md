# 💰 Cashplan - Get Your Cash Together

Eine moderne, web-basierte Haushalts-Finanz-App für Desktop und Mobile. Behalten Sie den Überblick über Ihre Finanzen mit Echtzeit-Synchronisation über Firebase.

## ✨ Features

### 📊 Dashboard
- Erfassen Sie tägliche Ausgaben mit Kategorien (Alltag & Sonderposten)
- Wochenweise Übersicht aller Ausgaben
- Monatsbilanz mit Einnahmen, Fixkosten und variablen Ausgaben
- Trend-Prognose basierend auf bisherigen Ausgaben

### 📈 Auswertung
- Detaillierte Monatsübersicht mit Kategorieaufteilung
- Jahresübersicht mit Gesamtbilanz
- Filterung nach Monat und Jahr
- Aufschlüsselung nach Alltag und Sonderposten

### ⚙️ Einstellungen
- Verwaltung von Fixkosten (monatlich oder nur für bestimmte Monate)
- Verwaltung von Einnahmen
- Automatische Synchronisation über Firebase Firestore

### 🔐 Authentifizierung
- E-Mail/Passwort Login
- Google Sign-In
- Sichere Datenhaltung pro Benutzer

### 🎨 Design
- Modernes, futuristisches Design mit Gradient-Effekten
- Vollständig responsive für Desktop und Mobile
- Dark Theme mit glassmorphism Effekten
- Animierte Übergänge und Interaktionen

## 🚀 Installation

### Voraussetzungen
- Node.js (v18 oder höher)
- npm oder yarn
- Ein Firebase-Projekt

### Schritt 1: Repository klonen
```bash
git clone <repository-url>
cd cashplan
```

### Schritt 2: Dependencies installieren
```bash
npm install
```

### Schritt 3: Firebase konfigurieren

1. Erstellen Sie ein neues Projekt in der [Firebase Console](https://console.firebase.google.com/)

2. Aktivieren Sie die folgenden Services:
   - **Authentication** (E-Mail/Passwort und Google)
   - **Firestore Database**

3. Erstellen Sie eine `.env` Datei im Projektroot:
```bash
cp .env.example .env
```

4. Tragen Sie Ihre Firebase-Konfiguration in die `.env` Datei ein:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Aktualisieren Sie `src/services/firebase.ts` um die Umgebungsvariablen zu nutzen:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### Schritt 4: Firestore Sicherheitsregeln

Konfigurieren Sie in der Firebase Console unter Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /fixedCosts/{costId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /incomes/{incomeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Schritt 5: App starten
```bash
npm run dev
```

Die App läuft nun auf `http://localhost:3000`

## 🏗️ Build für Produktion

```bash
npm run build
npm run preview
```

## 📱 Technologie-Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Authentication + Firestore)
- **Routing**: React Router v7
- **Icons**: Heroicons (via SVG)

## 📁 Projektstruktur

```
cashplan/
├── public/
│   └── logo.svg              # App-Logo
├── src/
│   ├── components/           # React-Komponenten
│   │   ├── ExpenseForm.tsx   # Ausgaben-Eingabeformular
│   │   ├── Header.tsx        # App-Header
│   │   ├── Navigation.tsx    # Navigationsleiste
│   │   └── WeekView.tsx      # Wochenansicht
│   ├── hooks/                # Custom React Hooks
│   │   └── useAuth.ts        # Authentication Hook
│   ├── pages/                # Seiten-Komponenten
│   │   ├── Analytics.tsx     # Auswertungsseite
│   │   ├── Dashboard.tsx     # Dashboard
│   │   ├── Login.tsx         # Login-Seite
│   │   └── Settings.tsx      # Einstellungen
│   ├── services/             # Services
│   │   ├── firebase.ts       # Firebase-Konfiguration
│   │   └── firestore.ts      # Firestore-Datenbankoperationen
│   ├── types/                # TypeScript-Typen
│   │   └── index.ts
│   ├── utils/                # Utility-Funktionen
│   │   └── dateUtils.ts      # Datums- und Formatierungsfunktionen
│   ├── App.tsx               # Haupt-App-Komponente
│   ├── index.css             # Globale Styles
│   └── main.tsx              # Entry Point
├── .env.example              # Beispiel für Umgebungsvariablen
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎯 Verwendung

### Dashboard
1. Melden Sie sich an oder registrieren Sie sich
2. Fügen Sie Ausgaben über das Formular hinzu
3. Wählen Sie die Kategorie (Alltag oder Sonderposten)
4. Sehen Sie die Wochenübersicht und Monatsbilanz
5. Nutzen Sie die Trend-Prognose für Ihre Planung

### Einstellungen
1. Navigieren Sie zum Einstellungen-Tab
2. Fügen Sie Ihre monatlichen Einnahmen hinzu
3. Erfassen Sie Fixkosten
4. Optional: Wählen Sie bei Fixkosten spezifische Monate aus

### Auswertung
1. Wählen Sie Monat und Jahr aus
2. Sehen Sie detaillierte Aufschlüsselungen nach Kategorien
3. Vergleichen Sie Ihre Jahresbilanz

## 🔮 Geplante Features

- [ ] Monatliche Abfrage zur Fixkosten-Übernahme am 1. des Monats
- [ ] Export-Funktion (CSV, PDF)
- [ ] Budgetverwaltung mit Warnungen
- [ ] Wiederkehrende Ausgaben
- [ ] Diagramme und Charts
- [ ] Push-Benachrichtigungen
- [ ] Multi-Währungsunterstützung
- [ ] Datenimport aus Banking-Apps

## 📄 Lizenz

ISC

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

---

**Cashplan** - Get your cash together! 💰
