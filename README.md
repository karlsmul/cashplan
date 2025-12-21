# 💰 Cashplan - Get Your Cash Together

Eine moderne, web-basierte Haushalts-Finanz-App für Desktop und Mobile. Behalten Sie den Überblick über Ihre Finanzen mit Echtzeit-Synchronisation über Firebase.

**🌐 Progressive Web App (PWA)** - Online und Offline nutzbar!
**🚀 Automatisches Deployment** via GitHub Actions zu Firebase Hosting

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

## 🚀 Schnellstart

### Option 1: Firebase Hosting (Empfohlen)

**Die App ist als PWA konfiguriert und wird automatisch über GitHub Actions deployed!**

Folgen Sie der detaillierten Anleitung in **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

Nach dem Setup ist die App erreichbar unter:
```
https://ihre-projekt-id.web.app
```

### Option 2: Lokale Entwicklung

#### Voraussetzungen
- Node.js (v18 oder höher)
- npm oder yarn
- Ein Firebase-Projekt

#### Schritt 1: Repository klonen
```bash
git clone <repository-url>
cd cashplan
```

#### Schritt 2: Dependencies installieren
```bash
npm install
```

#### Schritt 3: Firebase konfigurieren

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

#### Schritt 4: App starten
```bash
npm run dev
```

Die App läuft nun auf `http://localhost:3000`

## 🏗️ Build & Deployment

### Lokaler Build
```bash
npm run build
npm run preview
```

### Automatisches Deployment (Firebase Hosting)

Die App wird automatisch deployed, wenn Sie zum `main` oder `master` Branch pushen:

1. Code ändern
2. `git commit` und `git push`
3. GitHub Actions baut und deployed automatisch
4. App ist sofort unter Ihrer Firebase-URL verfügbar

Details siehe [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## 📱 Technologie-Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Backend**: Firebase (Authentication + Firestore)
- **Routing**: React Router v7
- **PWA**: vite-plugin-pwa + Workbox
- **CI/CD**: GitHub Actions
- **Hosting**: Firebase Hosting
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

## ✨ PWA-Features

Die App ist als Progressive Web App (PWA) konfiguriert:

- **Offline-Funktionalität**: Die App funktioniert auch ohne Internetverbindung
- **Installierbar**: Kann auf Desktop und Mobile wie eine native App installiert werden
- **Automatische Updates**: Neue Versionen werden automatisch im Hintergrund geladen
- **Cache-Strategie**: Intelligentes Caching für optimale Performance

### Installation als App:

**Smartphone (Android/iOS):**
1. Öffnen Sie die App im Browser
2. Tippen Sie auf "Zum Startbildschirm hinzufügen"

**Desktop (Chrome/Edge):**
1. Klicken Sie auf das ⊕-Symbol in der Adressleiste
2. Klicken Sie auf "Installieren"

## 🔮 Geplante Features

- [ ] Monatliche Abfrage zur Fixkosten-Übernahme am 1. des Monats
- [ ] Export-Funktion (CSV, PDF)
- [ ] Budgetverwaltung mit Warnungen
- [ ] Wiederkehrende Ausgaben
- [ ] Diagramme und Charts
- [ ] Push-Benachrichtigungen
- [ ] Multi-Währungsunterstützung
- [ ] Datenimport aus Banking-Apps
- [ ] Dark/Light Mode Toggle

## 📄 Lizenz

ISC

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

---

**Cashplan** - Get your cash together! 💰
