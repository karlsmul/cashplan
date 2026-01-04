# 🔥 Firebase Console - Schnellstart

Diese Kurzanleitung zeigt Ihnen, was Sie in der Firebase Console aktivieren müssen.

## 🔐 Schritt 1: Authentication aktivieren

1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/authentication
2. Klicken Sie auf **"Get started"** oder **"Erste Schritte"**
3. Aktivieren Sie **E-Mail/Passwort**:
   - Klicken Sie auf "E-Mail/Passwort"
   - Schalten Sie den Toggle auf **Aktiviert**
   - Klicken Sie auf **"Speichern"**
4. Aktivieren Sie **Google**:
   - Klicken Sie auf "Google"
   - Schalten Sie den Toggle auf **Aktiviert**
   - Wählen Sie Ihre E-Mail als Support-E-Mail
   - Klicken Sie auf **"Speichern"**

✅ **Fertig!** Authentication ist konfiguriert.

---

## 💾 Schritt 2: Firestore Database erstellen

1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/firestore
2. Klicken Sie auf **"Datenbank erstellen"**
3. Wählen Sie **"Im Produktionsmodus starten"**
4. Wählen Sie einen Standort:
   - Empfohlen für Deutschland: **europe-west3 (Frankfurt)**
   - Oder: **europe-west1 (Belgien)**
5. Klicken Sie auf **"Aktivieren"**
6. Warten Sie, bis die Database erstellt wurde

✅ **Fertig!** Firestore ist erstellt.

---

## 🛡️ Schritt 3: Firestore-Regeln veröffentlichen

Die Regeln sind bereits in Ihrem Repository unter `firestore.rules` definiert.

### Option A: Automatisch (über Deployment)
Die Regeln werden automatisch deployed, sobald Sie GitHub Actions konfiguriert haben.

### Option B: Manuell (sofort aktiv)
1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/firestore/rules
2. Ersetzen Sie die vorhandenen Regeln mit:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Expenses - Nur eigene Ausgaben lesbar/schreibbar
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Fixed Costs - Nur eigene Fixkosten lesbar/schreibbar
    match /fixedCosts/{costId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Incomes - Nur eigene Einnahmen lesbar/schreibbar
    match /incomes/{incomeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Klicken Sie auf **"Veröffentlichen"**

✅ **Fertig!** Die Daten sind sicher!

---

## 🌐 Schritt 4: Hosting aktivieren (optional - wird automatisch gemacht)

1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/hosting
2. Falls noch nicht aktiviert, klicken Sie auf **"Erste Schritte"**
3. Folgen Sie den Anweisungen (Installation nicht nötig, da über GitHub Actions)

✅ **Fertig!** Hosting ist bereit.

---

## 🔑 Schritt 5: Service Account für GitHub Actions

1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/settings/serviceaccounts/adminsdk
2. Klicken Sie auf **"Neuen privaten Schlüssel generieren"**
3. Klicken Sie auf **"Schlüssel generieren"**
4. **WICHTIG**: Bewahren Sie die heruntergeladene JSON-Datei sicher auf
5. Verwenden Sie den Inhalt für das GitHub Secret `FIREBASE_SERVICE_ACCOUNT`

---

## ✅ Checkliste

- [ ] Authentication aktiviert (E-Mail/Passwort + Google)
- [ ] Firestore Database erstellt
- [ ] Firestore-Regeln veröffentlicht
- [ ] Service Account JSON heruntergeladen

---

## 📊 Nächste Schritte

Nachdem Sie diese Schritte abgeschlossen haben:

1. Folgen Sie der Anleitung in **[GITHUB_SECRETS.md](./GITHUB_SECRETS.md)**
2. Pushen Sie zu main/master
3. Die App wird automatisch deployed!

## 🌐 Ihre App-URLs

Nach dem Deployment:
- **Haupt-URL**: https://cashplan-3c91c.web.app
- **Alternative URL**: https://cashplan-3c91c.firebaseapp.com

Sie können diese URLs auch in der Firebase Console unter "Hosting" finden.
