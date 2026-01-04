# 🚨 SOFORT-FIX: Firestore-Regeln deployen

## Problem
Ausgaben und Fixkosten werden nicht gespeichert, weil die Firestore-Regeln noch nicht aktiv sind.

## ⚡ Schnelle Lösung (2 Minuten)

### Schritt 1: Firestore-Regeln öffnen
1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/firestore/rules
2. Oder: Firebase Console → Firestore Database → Regeln

### Schritt 2: Regeln einfügen
Ersetzen Sie **ALLES** im Editor mit diesem Code:

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

### Schritt 3: Veröffentlichen
1. Klicken Sie auf **"Veröffentlichen"** (oben rechts)
2. Warten Sie auf die Bestätigung "Regeln wurden veröffentlicht"

## ✅ Fertig!

Die App sollte jetzt funktionieren! Testen Sie:
1. Aktualisieren Sie die App (F5)
2. Fügen Sie eine Testausgabe hinzu
3. Sie sollten jetzt eine **grüne Erfolgsmeldung** sehen: "✅ Ausgabe erfolgreich gespeichert!"

## 🔍 Troubleshooting

### Falls es immer noch nicht funktioniert:

#### 1. Prüfen Sie Authentication:
- https://console.firebase.google.com/project/cashplan-3c91c/authentication
- Stellen Sie sicher, dass **E-Mail/Passwort** und **Google** aktiviert sind

#### 2. Prüfen Sie Firestore:
- https://console.firebase.google.com/project/cashplan-3c91c/firestore
- Die Database sollte erstellt sein

#### 3. Browser-Console prüfen:
- Drücken Sie F12 in der App
- Gehen Sie zum "Console"-Tab
- Suchen Sie nach Fehlermeldungen
- Schicken Sie mir Screenshots von Fehlern

#### 4. Fehler in der App:
Ab sofort sehen Sie **rote Fehlermeldungen** in der App, wenn etwas schiefgeht:
- "❌ [Fehlermeldung]"
- Teilen Sie mir diese Meldung mit!

---

**Nach dem Deployen der Regeln sollte alles funktionieren!** 🎉
