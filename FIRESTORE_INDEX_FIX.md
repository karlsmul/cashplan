# 🚨 FIRESTORE INDEX FIX

## Problem
Die Console zeigt: "The query requires an index"

## ⚡ Lösung 1: Automatischer Index (1 Klick)

1. **Klicken Sie auf den blauen Link in der Browser-Console**
   - Der Link sieht so aus: `https://console.firebase.google.com/v1/r/project/cashplan-3c...`
   - Firebase erstellt den Index automatisch
   - Warten Sie 1-2 Minuten, bis der Index erstellt ist
   - Laden Sie die App neu (F5)

## 🔧 Lösung 2: Manuell (falls Link nicht funktioniert)

1. Öffnen Sie: https://console.firebase.google.com/project/cashplan-3c91c/firestore/indexes
2. Klicken Sie auf **"Index hinzufügen"**
3. Konfigurieren Sie:
   - **Sammlung**: `expenses`
   - **Felder**:
     * `userId` - Aufsteigend
     * `date` - Absteigend
   - Query-Bereich: **Sammlung**
4. Klicken Sie auf **"Index erstellen"**
5. Warten Sie 1-2 Minuten
6. Laden Sie die App neu (F5)

## ✅ Testen

Nach Index-Erstellung:
1. F5 drücken (App neu laden)
2. Ausgabe hinzufügen
3. Sie sollten die Ausgabe sofort in der Wochenübersicht sehen!

---

**Der Index wird nur EINMAL benötigt und gilt dann für immer!**
