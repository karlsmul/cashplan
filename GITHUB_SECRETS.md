# GitHub Secrets Konfiguration

## Schritt-für-Schritt Anleitung

### 1. GitHub Secrets öffnen

1. Gehen Sie zu: Repository → Settings → Secrets and variables → Actions
2. Oder direkt: `https://github.com/<username>/<repo>/settings/secrets/actions`

### 2. Fügen Sie die folgenden Secrets hinzu

Klicken Sie auf **"New repository secret"** für jeden Eintrag:

---

#### Secret 1:
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: `<Ihr Firebase API Key aus der Firebase Console>`

---

#### Secret 2:
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: `<projekt-id>.firebaseapp.com`

---

#### Secret 3:
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: `<projekt-id>`

---

#### Secret 4:
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: `<projekt-id>.firebasestorage.app`

---

#### Secret 5:
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: `<Ihre Messaging Sender ID aus Firebase Console>`

---

#### Secret 6:
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: `<Ihre App ID aus Firebase Console>`

---

### 3. Service Account erstellen (Letztes Secret)

#### A) Service Account JSON herunterladen:

1. Gehen Sie zur Firebase Console → Projekteinstellungen → Dienstkonten
2. Klicken Sie auf **"Neuen privaten Schlüssel generieren"**
3. Klicken Sie auf **"Schlüssel generieren"**
4. Eine JSON-Datei wird heruntergeladen

#### B) Secret in GitHub hinzufügen:

1. Öffnen Sie die heruntergeladene JSON-Datei in einem Texteditor
2. Kopieren Sie den **gesamten Inhalt** (alles von `{` bis `}`)
3. Gehen Sie zurück zu GitHub Secrets
4. Erstellen Sie ein neues Secret:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: [Fügen Sie hier den kompletten JSON-Inhalt ein]

---

## Checkliste

Nachdem Sie alle Secrets hinzugefügt haben, sollten Sie diese 7 Secrets sehen:

- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] FIREBASE_SERVICE_ACCOUNT

---

## Nächster Schritt

Sobald alle Secrets konfiguriert sind, wird beim nächsten Push automatisch deployed!

## Wo finde ich die Firebase Credentials?

1. Gehen Sie zu https://console.firebase.google.com
2. Wählen Sie Ihr Projekt
3. Klicken Sie auf das Zahnrad (Projekteinstellungen)
4. Scrollen Sie zu "Ihre Apps" → Web-App
5. Die Credentials finden Sie im `firebaseConfig` Objekt
