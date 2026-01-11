import React from 'react';

const Info: React.FC = () => {
  return (
    <main className="container mx-auto px-4 pb-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Datenspeicherung & Datenschutz
      </h1>

      {/* Einführung */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-purple-300 mb-4">Wie werden meine Daten gespeichert?</h2>
        <p className="text-white/80 leading-relaxed">
          Cashplan verwendet <strong className="text-white">Firebase Cloud Firestore</strong> von Google,
          um deine Finanzdaten sicher in der Cloud zu speichern. Zusätzlich werden deine Daten
          lokal auf deinem Gerät zwischengespeichert, damit die App auch offline funktioniert.
        </p>
      </div>

      {/* Cloud-Speicherung */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-green-400 mb-4">Cloud-Speicherung (Firebase)</h2>

        <div className="mb-4">
          <h3 className="font-semibold text-white mb-2">Vorteile:</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Geräteübergreifend:</strong> Greife von jedem Gerät auf deine Daten zu - Handy, Tablet oder Computer.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Automatische Backups:</strong> Deine Daten werden automatisch gesichert und gehen nicht verloren.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Echtzeit-Synchronisierung:</strong> Änderungen werden sofort auf allen Geräten sichtbar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Offline-Funktion:</strong> Die App funktioniert auch ohne Internet dank lokalem Cache.</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">Nachteile:</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Daten auf fremden Servern:</strong> Deine Daten liegen auf Google-Servern (Firebase).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Internet erforderlich:</strong> Für die erste Anmeldung und Synchronisierung wird Internet benötigt.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Abhängigkeit vom Anbieter:</strong> Falls Firebase eingestellt wird, müssten Daten migriert werden.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Lokale Speicherung */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-blue-400 mb-4">Lokale Speicherung (IndexedDB)</h2>

        <div className="mb-4">
          <h3 className="font-semibold text-white mb-2">Vorteile:</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Volle Kontrolle:</strong> Alle Daten bleiben nur auf deinem Gerät.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Keine Internetverbindung nötig:</strong> Die App funktioniert komplett offline.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span><strong className="text-white">Maximale Privatsphäre:</strong> Kein Drittanbieter hat Zugriff auf deine Finanzdaten.</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">Nachteile:</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Kein Backup:</strong> Wenn du dein Gerät verlierst oder den Browser-Cache löschst, sind die Daten weg.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Nur ein Gerät:</strong> Daten sind nicht auf anderen Geräten verfügbar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">-</span>
              <span><strong className="text-white">Speicherlimit:</strong> Browser begrenzen den lokalen Speicherplatz.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Aktuelle Konfiguration */}
      <div className="card mb-6 border border-purple-500/30">
        <h2 className="text-xl font-bold text-purple-300 mb-4">Deine aktuelle Konfiguration</h2>
        <p className="text-white/80 leading-relaxed mb-4">
          Cashplan nutzt derzeit die <strong className="text-white">Cloud-Speicherung</strong> mit lokalem Cache.
          Das bedeutet:
        </p>
        <ul className="space-y-2 text-white/80">
          <li className="flex items-start gap-2">
            <span className="text-purple-400">1.</span>
            <span>Deine Daten werden sicher in Firebase gespeichert</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">2.</span>
            <span>Eine lokale Kopie ermöglicht Offline-Nutzung</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">3.</span>
            <span>Änderungen werden automatisch synchronisiert, sobald du online bist</span>
          </li>
        </ul>
      </div>

      {/* Sicherheit */}
      <div className="card">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Sicherheitshinweise</h2>
        <ul className="space-y-3 text-white/80">
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">🔒</span>
            <span>Alle Daten werden über verschlüsselte Verbindungen (HTTPS) übertragen.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">👤</span>
            <span>Jeder Nutzer kann nur seine eigenen Daten sehen - andere Nutzer haben keinen Zugriff.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">🔑</span>
            <span>Verwende ein starkes Passwort und aktiviere wenn möglich die Zwei-Faktor-Authentifizierung.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">📱</span>
            <span>Melde dich auf öffentlichen Geräten immer ab, um unbefugten Zugriff zu verhindern.</span>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <p className="text-center text-white/40 text-sm mt-8">
        Bei Fragen zur Datenspeicherung wende dich an den App-Entwickler.
      </p>
    </main>
  );
};

export default Info;
