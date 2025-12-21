# 🚀 Firebase Setup & Deployment Anleitung

Diese Anleitung erklärt Schritt für Schritt, wie Sie Cashplan über Firebase deployen und automatisch über GitHub Actions aktualisieren lassen.

## Voraussetzungen

- Ein Google-Konto
- Zugriff auf Ihr GitHub-Repository

## 📋 Schritt 1: Firebase-Projekt erstellen

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
2. Klicken Sie auf **"Projekt hinzufügen"**
3. Geben Sie einen Projektnamen ein (z.B. "cashplan")
4. Optional: Deaktivieren Sie Google Analytics (nicht notwendig für diese App)
5. Klicken Sie auf **"Projekt erstellen"**

## 🔐 Schritt 2: Firebase Authentication einrichten

1. Klicken Sie in der linken Sidebar auf **"Authentication"**
2. Klicken Sie auf **"Erste Schritte"**
3. Aktivieren Sie **E-Mail/Passwort**:
   - Klicken Sie auf "E-Mail/Passwort"
   - Aktivieren Sie den Schalter
   - Klicken Sie auf "Speichern"
4. Aktivieren Sie **Google**:
   - Klicken Sie auf "Google"
   - Aktivieren Sie den Schalter
   - Wählen Sie eine Support-E-Mail
   - Klicken Sie auf "Speichern"

## 💾 Schritt 3: Firestore Database einrichten

1. Klicken Sie in der linken Sidebar auf **"Firestore Database"**
2. Klicken Sie auf **"Datenbank erstellen"**
3. Wählen Sie **"Im Produktionsmodus starten"**
4. Wählen Sie einen Standort (z.B. "europe-west3" für Frankfurt)
5. Klicken Sie auf **"Aktivieren"**

### Sicherheitsregeln konfigurieren

1. Gehen Sie zu **"Regeln"**
2. Ersetzen Sie die Regeln mit folgendem Code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Expenses
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Fixed Costs
    match /fixedCosts/{costId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Incomes
    match /incomes/{incomeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Klicken Sie auf **"Veröffentlichen"**

## 🌐 Schritt 4: Firebase Hosting aktivieren

1. Klicken Sie in der linken Sidebar auf **"Hosting"**
2. Klicken Sie auf **"Erste Schritte"**
3. Folgen Sie den Anweisungen (Sie müssen nichts installieren, da wir GitHub Actions verwenden)

## 🔑 Schritt 5: Firebase-Konfiguration abrufen

1. Klicken Sie auf das **Zahnrad-Symbol** (⚙️) neben "Projektübersicht"
2. Klicken Sie auf **"Projekteinstellungen"**
3. Scrollen Sie nach unten zu **"Ihre Apps"**
4. Klicken Sie auf **"Web-App hinzufügen"** (Symbol: `</>`):
   - App-Nickname: "Cashplan Web"
   - Firebase Hosting: **Aktivieren Sie den Schalter**
   - Klicken Sie auf **"App registrieren"**
5. Kopieren Sie die **firebaseConfig**-Werte (Sie benötigen diese im nächsten Schritt)

## 🔐 Schritt 6: GitHub Secrets konfigurieren

1. Gehen Sie zu Ihrem GitHub-Repository
2. Klicken Sie auf **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Klicken Sie auf **"New repository secret"** und fügen Sie folgende Secrets hinzu:

### Firebase Config Secrets:
- **Name**: `VITE_FIREBASE_API_KEY`
  - **Value**: Ihr `apiKey` aus der Firebase-Config

- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
  - **Value**: Ihr `authDomain` aus der Firebase-Config

- **Name**: `VITE_FIREBASE_PROJECT_ID`
  - **Value**: Ihr `projectId` aus der Firebase-Config

- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
  - **Value**: Ihr `storageBucket` aus der Firebase-Config

- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - **Value**: Ihr `messagingSenderId` aus der Firebase-Config

- **Name**: `VITE_FIREBASE_APP_ID`
  - **Value**: Ihr `appId` aus der Firebase-Config

## 🔐 Schritt 7: Service Account für GitHub Actions erstellen

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
2. Wählen Sie Ihr Projekt aus
3. Klicken Sie auf das **Zahnrad-Symbol** → **"Projekteinstellungen"**
4. Gehen Sie zu **"Dienstkonten"**
5. Klicken Sie auf **"Neuen privaten Schlüssel generieren"**
6. Klicken Sie auf **"Schlüssel generieren"**
7. Eine JSON-Datei wird heruntergeladen

### Service Account zu GitHub hinzufügen:

1. Öffnen Sie die heruntergeladene JSON-Datei
2. Kopieren Sie den **gesamten Inhalt** der Datei
3. Gehen Sie zurück zu GitHub → **"Settings"** → **"Secrets and variables"** → **"Actions"**
4. Erstellen Sie ein neues Secret:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Fügen Sie den gesamten JSON-Inhalt ein

## 📝 Schritt 8: .firebaserc aktualisieren

1. Öffnen Sie die Datei `.firebaserc` in Ihrem Repository
2. Ersetzen Sie `YOUR_FIREBASE_PROJECT_ID` mit Ihrer tatsächlichen Project ID
3. Committen und pushen Sie die Änderung

```json
{
  "projects": {
    "default": "ihre-projekt-id"
  }
}
```

## 🚀 Schritt 9: Deployment

Nach dem Push zu `main` oder `master`:

1. GitHub Actions wird automatisch gestartet
2. Die App wird gebaut
3. Die App wird zu Firebase Hosting deployed
4. Sie erhalten eine URL wie: `https://ihre-projekt-id.web.app`

### Deployment manuell anstoßen:

1. Gehen Sie zu Ihrem GitHub-Repository
2. Klicken Sie auf **"Actions"**
3. Wählen Sie den Workflow **"Deploy to Firebase Hosting"**
4. Klicken Sie auf **"Run workflow"**

## 🌐 Ihre App-URL

Nach erfolgreichem Deployment ist Ihre App erreichbar unter:

```
https://ihre-projekt-id.web.app
```

oder

```
https://ihre-projekt-id.firebaseapp.com
```

Sie finden die URL auch in der Firebase Console unter **"Hosting"**.

## 📱 PWA-Installation

Die App ist als Progressive Web App (PWA) konfiguriert:

### Auf dem Smartphone:
1. Öffnen Sie die App im Browser
2. Tippen Sie auf "Zum Startbildschirm hinzufügen"
3. Die App verhält sich wie eine native App

### Am Desktop:
1. Öffnen Sie die App in Chrome/Edge
2. Klicken Sie auf das ⊕-Symbol in der Adressleiste
3. Klicken Sie auf "Installieren"

## 🔄 Automatische Updates

Jeder Push zum `main`/`master` Branch triggert automatisch:
1. Build der App
2. Deployment zu Firebase Hosting
3. Die neue Version ist sofort verfügbar

## 🔍 Troubleshooting

### Build schlägt fehl:
- Überprüfen Sie, ob alle GitHub Secrets korrekt gesetzt sind
- Schauen Sie sich die Logs in GitHub Actions an

### Authentifizierung funktioniert nicht:
- Überprüfen Sie die Firestore-Sicherheitsregeln
- Stellen Sie sicher, dass E-Mail/Passwort und Google in Authentication aktiviert sind

### App lädt nicht:
- Leeren Sie den Browser-Cache
- Überprüfen Sie die Firebase Hosting URL

## ✅ Checkliste

- [ ] Firebase-Projekt erstellt
- [ ] Authentication aktiviert (E-Mail/Passwort + Google)
- [ ] Firestore Database erstellt
- [ ] Firestore-Sicherheitsregeln konfiguriert
- [ ] Firebase Hosting aktiviert
- [ ] Web-App in Firebase registriert
- [ ] Alle 6 Firebase Config Secrets in GitHub hinzugefügt
- [ ] FIREBASE_SERVICE_ACCOUNT Secret in GitHub hinzugefügt
- [ ] .firebaserc mit Project ID aktualisiert
- [ ] Änderungen gepusht
- [ ] GitHub Actions Workflow erfolgreich durchgelaufen
- [ ] App unter Firebase-URL erreichbar

---

**Viel Erfolg!** 🎉

Bei Fragen schauen Sie in die [Firebase-Dokumentation](https://firebase.google.com/docs) oder die [GitHub Actions Dokumentation](https://docs.github.com/actions).
