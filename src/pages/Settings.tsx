import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FixedCost, Income } from '../types';
import {
  addFixedCost,
  addIncome,
  deleteFixedCost,
  deleteIncome,
  updateFixedCost,
  updateIncome,
  subscribeToFixedCosts,
  subscribeToIncomes,
  copyFixedCostsFromPreviousMonth,
  copyIncomesFromPreviousMonth,
  deleteAllExpenses,
  deleteExpensesForMonth
} from '../services/firestore';
import { formatCurrency, getMonthName } from '../utils/dateUtils';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  // Monatswähler
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1);

  const [newFixedCost, setNewFixedCost] = useState({ name: '', amount: '' });
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });

  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncomeForm, setEditIncomeForm] = useState({ name: '', amount: '' });
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editFixedCostForm, setEditFixedCostForm] = useState({ name: '', amount: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteMonth, setDeleteMonth] = useState(new Date().getMonth());
  const [deleteYear, setDeleteYear] = useState(new Date().getFullYear());
  const [deleting, setDeleting] = useState(false);

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  useEffect(() => {
    if (!user) return;

    const unsubscribeFixedCosts = subscribeToFixedCosts(user.uid, setFixedCosts);
    const unsubscribeIncomes = subscribeToIncomes(user.uid, setIncomes);

    return () => {
      unsubscribeFixedCosts();
      unsubscribeIncomes();
    };
  }, [user]);

  // Handler: Fixkosten hinzufügen
  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addFixedCost({
        name: newFixedCost.name,
        amount: parseFloat(newFixedCost.amount),
        yearMonth: selectedYearMonth,
        userId: user.uid
      });

      setNewFixedCost({ name: '', amount: '' });
      setSuccess('Fixkosten erfolgreich hinzugefügt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Hinzufügen der Fixkosten.');
    }
  };

  // Handler: Einnahme hinzufügen
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addIncome({
        name: newIncome.name,
        amount: parseFloat(newIncome.amount),
        yearMonth: selectedYearMonth,
        userId: user.uid
      });

      setNewIncome({ name: '', amount: '' });
      setSuccess('Einnahme erfolgreich hinzugefügt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Hinzufügen der Einnahme.');
    }
  };

  // Handler: Vormonat kopieren
  const handleCopyFromPreviousMonth = async () => {
    if (!user || !confirm('Möchten Sie Fixkosten und Einnahmen vom Vormonat kopieren?')) return;

    try {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevYearMonth = prevYear * 100 + (prevMonth + 1);

      const [copiedCosts, copiedIncomes] = await Promise.all([
        copyFixedCostsFromPreviousMonth(user.uid, prevYearMonth, selectedYearMonth),
        copyIncomesFromPreviousMonth(user.uid, prevYearMonth, selectedYearMonth)
      ]);

      setSuccess(`${copiedCosts} Fixkosten und ${copiedIncomes} Einnahmen kopiert!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Kopieren.');
    }
  };

  // Handler: Fixkosten-Status (bezahlt) togglen
  const toggleFixedCostPaid = async (cost: FixedCost) => {
    if (!user) return;

    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthKey = currentYear * 100 + (currentMonth + 1);

      const isPaid = cost.paidMonths?.includes(monthKey) || false;
      const updatedPaidMonths = isPaid
        ? (cost.paidMonths || []).filter((m) => m !== monthKey)
        : [...(cost.paidMonths || []), monthKey];

      await updateFixedCost(cost.id, { paidMonths: updatedPaidMonths });
    } catch (error) {
      setError('Fehler beim Aktualisieren des Bezahlt-Status.');
    }
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditIncomeForm({ name: income.name, amount: income.amount.toString() });
  };

  const handleSaveIncome = async () => {
    if (!editingIncome) return;

    try {
      await updateIncome(editingIncome.id, {
        name: editIncomeForm.name,
        amount: parseFloat(editIncomeForm.amount)
      });
      setEditingIncome(null);
      setSuccess('Einnahme erfolgreich aktualisiert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Aktualisieren.');
    }
  };

  const handleEditFixedCost = (cost: FixedCost) => {
    setEditingFixedCost(cost);
    setEditFixedCostForm({ name: cost.name, amount: cost.amount.toString() });
  };

  const handleSaveFixedCost = async () => {
    if (!editingFixedCost) return;

    try {
      await updateFixedCost(editingFixedCost.id, {
        name: editFixedCostForm.name,
        amount: parseFloat(editFixedCostForm.amount)
      });
      setEditingFixedCost(null);
      setSuccess('Fixkosten erfolgreich aktualisiert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Aktualisieren.');
    }
  };

  const handleDeleteFixedCost = async (id: string) => {
    if (confirm('Möchten Sie diese Fixkosten wirklich löschen?')) {
      await deleteFixedCost(id);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (confirm('Möchten Sie diese Einnahme wirklich löschen?')) {
      await deleteIncome(id);
    }
  };

  const handleDeleteExpenses = async (allTime: boolean) => {
    if (!user) return;

    const confirmMessage = allTime
      ? 'Möchten Sie wirklich ALLE Ausgaben löschen? Dies kann nicht rückgängig gemacht werden!'
      : `Möchten Sie alle Ausgaben für ${monthNames[deleteMonth]} ${deleteYear} löschen?`;

    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      if (allTime) {
        await deleteAllExpenses(user.uid);
        setSuccess('Alle Ausgaben wurden gelöscht.');
      } else {
        await deleteExpensesForMonth(user.uid, deleteMonth, deleteYear);
        setSuccess(`Ausgaben für ${monthNames[deleteMonth]} ${deleteYear} wurden gelöscht.`);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Löschen.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtere für ausgewählten Monat
  const filteredFixedCosts = fixedCosts.filter((cost) => cost.yearMonth === selectedYearMonth);
  const filteredIncomes = incomes.filter((income) => income.yearMonth === selectedYearMonth);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Einstellungen
      </h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200 mb-6">
          {success}
        </div>
      )}

      {/* Monatswähler */}
      <div className="card mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <h3 className="text-xl font-bold mb-4 text-purple-300">📅 Monat auswählen</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Monat</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select w-full"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Jahr</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select w-full"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 1 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <button
          onClick={handleCopyFromPreviousMonth}
          className="btn-primary w-full"
        >
          📋 Vormonat kopieren ({getMonthName(selectedMonth === 0 ? 11 : selectedMonth - 1)} {selectedMonth === 0 ? selectedYear - 1 : selectedYear})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Einnahmen */}
        <div>
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Einnahme hinzufügen</h2>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bezeichnung</label>
                <input
                  type="text"
                  value={newIncome.name}
                  onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                  className="input w-full"
                  placeholder="z.B. Gehalt"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-sm text-white/60">
                Wird für {getMonthName(selectedMonth)} {selectedYear} hinzugefügt
              </p>
              <button type="submit" className="btn-primary w-full">
                Einnahme hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-green-300">
              Einnahmen für {getMonthName(selectedMonth)} {selectedYear}
            </h3>
            <div className="space-y-3">
              {filteredIncomes.map((income) => (
                <div key={income.id}>
                  {editingIncome?.id === income.id ? (
                    <div className="bg-white/10 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Bezeichnung</label>
                        <input
                          type="text"
                          value={editIncomeForm.name}
                          onChange={(e) => setEditIncomeForm({ ...editIncomeForm, name: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editIncomeForm.amount}
                          onChange={(e) => setEditIncomeForm({ ...editIncomeForm, amount: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveIncome} className="btn-primary flex-1">
                          ✓ Speichern
                        </button>
                        <button
                          onClick={() => setEditingIncome(null)}
                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 group">
                      <div className="flex-1">
                        <p className="font-medium">{income.name}</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(income.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditIncome(income)}
                          className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredIncomes.length === 0 && (
                <p className="text-white/60 text-center py-8">
                  Keine Einnahmen für {getMonthName(selectedMonth)} {selectedYear}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fixkosten */}
        <div>
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Fixkosten hinzufügen</h2>
            <form onSubmit={handleAddFixedCost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bezeichnung</label>
                <input
                  type="text"
                  value={newFixedCost.name}
                  onChange={(e) => setNewFixedCost({ ...newFixedCost, name: e.target.value })}
                  className="input w-full"
                  placeholder="z.B. Miete, Strom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFixedCost.amount}
                  onChange={(e) => setNewFixedCost({ ...newFixedCost, amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-sm text-white/60">
                Wird für {getMonthName(selectedMonth)} {selectedYear} hinzugefügt
              </p>
              <button type="submit" className="btn-primary w-full">
                Fixkosten hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-red-300">
              Fixkosten für {getMonthName(selectedMonth)} {selectedYear}
            </h3>
            <p className="text-sm text-white/60 mb-4">
              💡 Klicken Sie auf eine Fixkosten-Karte, um sie für diesen Monat als bezahlt zu markieren
            </p>
            <div className="space-y-3">
              {filteredFixedCosts.map((cost) => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthKey = currentYear * 100 + (currentMonth + 1);
                const isPaid = cost.paidMonths?.includes(monthKey) || false;

                return (
                  <div key={cost.id}>
                    {editingFixedCost?.id === cost.id ? (
                      <div className="bg-white/10 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Bezeichnung</label>
                          <input
                            type="text"
                            value={editFixedCostForm.name}
                            onChange={(e) => setEditFixedCostForm({ ...editFixedCostForm, name: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFixedCostForm.amount}
                            onChange={(e) => setEditFixedCostForm({ ...editFixedCostForm, amount: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveFixedCost} className="btn-primary flex-1">
                            ✓ Speichern
                          </button>
                          <button
                            onClick={() => setEditingFixedCost(null)}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => toggleFixedCostPaid(cost)}
                        className={`flex items-center justify-between rounded-lg p-4 cursor-pointer transition-all group ${
                          isPaid
                            ? 'bg-green-500/20 border-2 border-green-500/50'
                            : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                        }`}
                      >
                        <div className="flex-1 pointer-events-none">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{cost.name}</p>
                            {isPaid && (
                              <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
                                ✓ Bezahlt
                              </span>
                            )}
                          </div>
                          <p className={`text-2xl font-bold ${isPaid ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(cost.amount)}
                          </p>
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFixedCost(cost);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFixedCost(cost.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredFixedCosts.length === 0 && (
                <p className="text-white/60 text-center py-8">
                  Keine Fixkosten für {getMonthName(selectedMonth)} {selectedYear}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Datenverwaltung */}
      <div className="mt-8">
        <div className="card bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
          <h2 className="text-2xl font-bold mb-4 text-orange-400">⚠️ Datenverwaltung</h2>
          <p className="text-white/70 mb-6">
            Hier können Sie Ausgaben löschen. Diese Aktionen können nicht rückgängig gemacht werden!
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Ausgaben für einen Monat löschen</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monat</label>
                    <select
                      value={deleteMonth}
                      onChange={(e) => setDeleteMonth(parseInt(e.target.value))}
                      className="select w-full"
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jahr</label>
                    <select
                      value={deleteYear}
                      onChange={(e) => setDeleteYear(parseInt(e.target.value))}
                      className="select w-full"
                    >
                      {Array.from({ length: 3 }, (_, i) => {
                        const year = new Date().getFullYear() - 1 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteExpenses(false)}
                  disabled={deleting}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {deleting ? 'Löschen...' : `Ausgaben für ${monthNames[deleteMonth]} ${deleteYear} löschen`}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Alle Ausgaben löschen</h3>
              <p className="text-white/60 mb-4">
                Löscht alle Ausgaben aus allen Monaten. Dies kann NICHT rückgängig gemacht werden!
              </p>
              <button
                onClick={() => handleDeleteExpenses(true)}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {deleting ? 'Löschen...' : 'Alle Ausgaben löschen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
