# 🔐 GitHub Secrets Konfiguration

## Schritt-für-Schritt Anleitung

### 1. Öffnen Sie GitHub Secrets

1. Gehen Sie zu: https://github.com/karlsmul/cashplan/settings/secrets/actions
2. Oder: Repository → Settings → Secrets and variables → Actions

### 2. Fügen Sie die folgenden Secrets hinzu

Klicken Sie auf **"New repository secret"** für jeden Eintrag:

---

#### Secret 1:
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: `AIzaSyBxIyWRh7qUqcXiJhz_QOxaRYDvzvEt4kU`

---

#### Secret 2:
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: `cashplan-3c91c.firebaseapp.com`

---

#### Secret 3:
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: `cashplan-3c91c`

---

#### Secret 4:
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: `cashplan-3c91c.firebasestorage.app`

---

#### Secret 5:
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: `1010097843636`

---

#### Secret 6:
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: `1:1010097843636:web:7c8d68c5b92be28103d6e1`

---

### 3. Service Account erstellen (Letztes Secret)

#### A) Service Account JSON herunterladen:

1. Gehen Sie zur Firebase Console: https://console.firebase.google.com/project/cashplan-3c91c/settings/serviceaccounts/adminsdk
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

## ✅ Checkliste

Nachdem Sie alle Secrets hinzugefügt haben, sollten Sie diese 7 Secrets sehen:

- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] FIREBASE_SERVICE_ACCOUNT

---

## 🚀 Nächster Schritt

Sobald alle Secrets konfiguriert sind, wird beim nächsten Push automatisch deployed!

Die App wird dann verfügbar sein unter:
- https://cashplan-3c91c.web.app
- https://cashplan-3c91c.firebaseapp.com
