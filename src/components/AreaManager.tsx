import React, { useState, useMemo } from 'react';
import { ExpenseArea, Expense } from '../types';
import { addExpenseArea, updateExpenseArea, deleteExpenseArea } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AREA_COLORS } from '../utils/areaMatching';
import AutocompleteInput from './AutocompleteInput';

interface AreaManagerProps {
  areas: ExpenseArea[];
  expenses: Expense[];
}

const AreaManager: React.FC<AreaManagerProps> = ({ areas, expenses }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(AREA_COLORS[0]);
  const [newKeywords, setNewKeywords] = useState<{ [areaId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extrahiere einzigartige Beschreibungen aus Ausgaben für Autocomplete
  const expenseDescriptions = useMemo(() => {
    const descriptions = expenses.map(e => e.description);
    // Zähle Häufigkeit
    const frequency: { [key: string]: number } = {};
    descriptions.forEach(desc => {
      frequency[desc] = (frequency[desc] || 0) + 1;
    });
    // Sortiere nach Häufigkeit und entferne Duplikate
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([desc]) => desc);
  }, [expenses]);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAreaName.trim()) return;

    setLoading(true);
    setError('');

    try {
      await addExpenseArea({
        name: newAreaName.trim(),
        color: newAreaColor,
        keywords: [],
        priority: areas.length + 1, // Neue Bereiche bekommen höchste Priorität
        userId: user.uid
      });
      setNewAreaName('');
      // Nächste verfügbare Farbe wählen
      const usedColors = areas.map(a => a.color);
      const nextColor = AREA_COLORS.find(c => !usedColors.includes(c)) || AREA_COLORS[0];
      setNewAreaColor(nextColor);
    } catch (err) {
      setError('Fehler beim Erstellen des Bereichs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (areaId: string) => {
    const keyword = newKeywords[areaId]?.trim();
    if (!keyword) return;

    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    // Prüfe auf Duplikate
    if (area.keywords.some(k => k.toLowerCase() === keyword.toLowerCase())) {
      setError('Dieses Schlagwort existiert bereits in diesem Bereich');
      return;
    }

    try {
      await updateExpenseArea(areaId, {
        keywords: [...area.keywords, keyword]
      });
      setNewKeywords(prev => ({ ...prev, [areaId]: '' }));
      setError('');
    } catch (err) {
      setError('Fehler beim Hinzufügen des Schlagworts');
      console.error(err);
    }
  };

  const handleRemoveKeyword = async (areaId: string, keyword: string) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    try {
      await updateExpenseArea(areaId, {
        keywords: area.keywords.filter(k => k !== keyword)
      });
    } catch (err) {
      setError('Fehler beim Entfernen des Schlagworts');
      console.error(err);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Bereich wirklich löschen? Die Ausgaben bleiben erhalten, werden aber nicht mehr diesem Bereich zugeordnet.')) {
      return;
    }

    try {
      await deleteExpenseArea(areaId);
    } catch (err) {
      setError('Fehler beim Löschen des Bereichs');
      console.error(err);
    }
  };

  return (
    <div className="card mb-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-teal-300">
          Bereiche verwalten
        </h3>
        <button className="text-teal-400 hover:text-teal-300 transition-colors">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Formular für neuen Bereich */}
          <form onSubmit={handleAddArea} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Neuer Bereich</label>
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="z.B. Lebensmittel"
                className="input w-full"
                maxLength={50}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Farbe</label>
                <div className="flex gap-1 flex-wrap">
                  {AREA_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAreaColor(color)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        newAreaColor === color ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !newAreaName.trim()}
                className="btn-primary h-10 px-4 mt-5"
              >
                + Hinzufügen
              </button>
            </div>
          </form>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Liste der Bereiche */}
          <div className="space-y-3">
            {areas.length === 0 ? (
              <p className="text-white/60 text-sm">
                Noch keine Bereiche erstellt. Erstelle einen Bereich und füge Schlagworte hinzu,
                um deine Ausgaben automatisch zu kategorisieren.
              </p>
            ) : (
              areas.map(area => (
                <div
                  key={area.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-medium">{area.name}</span>
                      <span className="text-white/40 text-sm">
                        ({area.keywords.length} Schlagworte)
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Löschen
                    </button>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {area.keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-sm"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(area.id, keyword)}
                          className="text-white/40 hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Neues Keyword hinzufügen */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AutocompleteInput
                        value={newKeywords[area.id] || ''}
                        onChange={(value) => setNewKeywords(prev => ({
                          ...prev,
                          [area.id]: value
                        }))}
                        suggestions={expenseDescriptions}
                        placeholder="Schlagwort hinzufügen..."
                        className="input w-full text-sm py-1"
                        maxLength={50}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddKeyword(area.id)}
                      disabled={!newKeywords[area.id]?.trim()}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaManager;
