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
  deleteAllExpenses,
  deleteExpensesForMonth
} from '../services/firestore';
import { formatCurrency, getMonthName } from '../utils/dateUtils';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  // Monatswähler für Fixkosten
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1);

  const [newFixedCost, setNewFixedCost] = useState({
    name: '',
    amount: '',
    costType: 'recurring' as 'recurring' | 'specific',
    months: [] as number[],
    specificMonths: [] as number[],
    specificYear: new Date().getFullYear() + 1,
    specificMonth: 0
  });
  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: '',
    incomeType: 'recurring' as 'recurring' | 'specific',
    months: [] as number[],
    specificMonths: [] as number[],
    specificYear: new Date().getFullYear() + 1, // Default: nächstes Jahr
    specificMonth: 0 // Default: Januar
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteMonth, setDeleteMonth] = useState(new Date().getMonth());
  const [deleteYear, setDeleteYear] = useState(new Date().getFullYear());
  const [deleting, setDeleting] = useState(false);

  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncomeForm, setEditIncomeForm] = useState({
    name: '',
    amount: '',
    incomeType: 'recurring' as 'recurring' | 'specific',
    months: [] as number[],
    specificMonths: [] as number[]
  });
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editFixedCostForm, setEditFixedCostForm] = useState({
    name: '',
    amount: '',
    costType: 'recurring' as 'recurring' | 'specific',
    months: [] as number[],
    specificMonths: [] as number[]
  });

  const monthNames = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
  ];

  useEffect(() => {
    if (!user) return;

    // Alle Fixkosten laden, später nach Monat filtern
    const unsubscribeFixedCosts = subscribeToFixedCosts(user.uid, setFixedCosts);
    const unsubscribeIncomes = subscribeToIncomes(user.uid, setIncomes);

    return () => {
      unsubscribeFixedCosts();
      unsubscribeIncomes();
    };
  }, [user]);

  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');

    try {
      const fixedCostData: any = {
        name: newFixedCost.name,
        amount: parseFloat(newFixedCost.amount),
        userId: user.uid
      };

      // Nur months hinzufügen, wenn welche ausgewählt wurden
      if (newFixedCost.months.length > 0) {
        fixedCostData.months = newFixedCost.months;
      }

      await addFixedCost(fixedCostData);

      setNewFixedCost({
        name: '',
        amount: '',
        costType: 'recurring',
        months: [],
        specificMonths: [],
        specificYear: new Date().getFullYear() + 1,
        specificMonth: 0
      });
      setSuccess('Fixkosten erfolgreich hinzugefügt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen der Fixkosten:', error);
      setError(error.message || 'Fehler beim Speichern. Überprüfen Sie die Firestore-Regeln.');
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');

    try {
      const incomeData: any = {
        name: newIncome.name,
        amount: parseFloat(newIncome.amount),
        userId: user.uid
      };

      // Nur months hinzufügen, wenn welche ausgewählt wurden
      if (newIncome.months.length > 0) {
        incomeData.months = newIncome.months;
      }

      await addIncome(incomeData);

      setNewIncome({
        name: '',
        amount: '',
        incomeType: 'recurring',
        months: [],
        specificMonths: [],
        specificYear: new Date().getFullYear() + 1,
        specificMonth: 0
      });
      setSuccess('Einnahme erfolgreich hinzugefügt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen der Einnahme:', error);
      setError(error.message || 'Fehler beim Speichern. Überprüfen Sie die Firestore-Regeln.');
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

  const toggleFixedCostPaid = async (cost: FixedCost) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthKey = currentYear * 100 + (currentMonth + 1); // Format: YYYYMM (z.B. 202412)

    const paidMonths = cost.paidMonths || [];
    const isPaid = paidMonths.includes(monthKey);

    const updatedPaidMonths = isPaid
      ? paidMonths.filter(m => m !== monthKey)
      : [...paidMonths, monthKey];

    try {
      await updateFixedCost(cost.id, { paidMonths: updatedPaidMonths });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Bezahlt-Status:', error);
      setError('Fehler beim Aktualisieren des Bezahlt-Status.');
    }
  };

  const toggleFixedCostMonth = (month: number) => {
    setNewFixedCost((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort((a, b) => a - b);
      return { ...prev, months };
    });
  };

  const toggleEditFixedCostMonth = (month: number) => {
    setEditFixedCostForm((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort((a, b) => a - b);
      return { ...prev, months };
    });
  };

  const toggleIncomeMonth = (month: number) => {
    setNewIncome((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort((a, b) => a - b);
      return { ...prev, months };
    });
  };

  const toggleEditIncomeMonth = (month: number) => {
    setEditIncomeForm((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort((a, b) => a - b);
      return { ...prev, months };
    });
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditIncomeForm({
      name: income.name,
      amount: income.amount.toString(),
      incomeType: 'recurring', // Legacy field
      months: income.months || [],
      specificMonths: []
    });
  };

  const handleSaveIncome = async () => {
    if (!editingIncome) return;

    try {
      const updateData: any = {
        name: editIncomeForm.name,
        amount: parseFloat(editIncomeForm.amount)
      };

      // Nur months hinzufügen, wenn welche ausgewählt wurden
      if (editIncomeForm.months.length > 0) {
        updateData.months = editIncomeForm.months;
      } else {
        updateData.months = [];
      }

      await updateIncome(editingIncome.id, updateData);
      setEditingIncome(null);
      setSuccess('Einnahme erfolgreich aktualisiert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Einnahme:', error);
      setError(error.message || 'Fehler beim Aktualisieren.');
    }
  };

  const handleEditFixedCost = (cost: FixedCost) => {
    setEditingFixedCost(cost);
    setEditFixedCostForm({
      name: cost.name,
      amount: cost.amount.toString(),
      costType: 'recurring', // Legacy field
      months: cost.months || [],
      specificMonths: []
    });
  };

  const handleSaveFixedCost = async () => {
    if (!editingFixedCost) return;

    try {
      const updateData: any = {
        name: editFixedCostForm.name,
        amount: parseFloat(editFixedCostForm.amount)
      };

      // Nur months hinzufügen, wenn welche ausgewählt wurden
      if (editFixedCostForm.months.length > 0) {
        updateData.months = editFixedCostForm.months;
      } else {
        updateData.months = [];
      }

      await updateFixedCost(editingFixedCost.id, updateData);
      setEditingFixedCost(null);
      setSuccess('Fixkosten erfolgreich aktualisiert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren der Fixkosten:', error);
      setError(error.message || 'Fehler beim Aktualisieren.');
    }
  };

  const handleDeleteMonthExpenses = async () => {
    if (!user) return;

    const monthName = getMonthName(deleteMonth);
    if (!window.confirm(
      `⚠️ ACHTUNG: Alle Ausgaben für ${monthName} ${deleteYear} werden unwiderruflich gelöscht!\n\nMöchten Sie wirklich fortfahren?`
    )) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteExpensesForMonth(user.uid, deleteMonth, deleteYear);
      setSuccess(`Alle Ausgaben für ${monthName} ${deleteYear} wurden gelöscht.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Fehler beim Löschen der Ausgaben:', error);
      setError(error.message || 'Fehler beim Löschen der Ausgaben.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllExpenses = async () => {
    if (!user) return;

    if (!window.confirm(
      `🚨 WARNUNG: ALLE Ihre Ausgaben werden unwiderruflich gelöscht!\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nMöchten Sie wirklich ALLE Ausgaben löschen?`
    )) {
      return;
    }

    // Doppelte Bestätigung für kritische Aktion
    if (!window.confirm(
      `Sind Sie sich wirklich sicher?\n\nDies ist Ihre letzte Chance!\n\nALLE Ausgaben werden gelöscht!`
    )) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteAllExpenses(user.uid);
      setSuccess('Alle Ausgaben wurden gelöscht.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Fehler beim Löschen aller Ausgaben:', error);
      setError(error.message || 'Fehler beim Löschen der Ausgaben.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtere Fixkosten nach ausgewähltem Monat
  const filteredFixedCosts = fixedCosts.filter((cost) => {
    // Wenn yearMonth gesetzt (neues System), prüfe ob es zum ausgewählten Monat passt
    if (cost.yearMonth) {
      return cost.yearMonth === selectedYearMonth;
    }
    // Ansonsten (altes System): Prüfe months Array
    if (cost.months && cost.months.length > 0) {
      return cost.months.includes(selectedMonth + 1);
    }
    // Keine Monate = gilt für alle Monate
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Einstellungen
      </h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 mb-6">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200 mb-6">
          ✅ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Einnahmen */}
        <div>
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Einnahmen hinzufügen</h2>
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

              {/* Monate */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gilt für Monate (leer = alle Monate)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleIncomeMonth(index + 1)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        newIncome.months.includes(index + 1)
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Einnahme hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-green-300">Ihre Einnahmen</h3>
            <div className="space-y-3">
              {incomes.map((income) => (
                <div key={income.id}>
                  {editingIncome?.id === income.id ? (
                    // Edit-Formular
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

                      {/* Monate */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Gilt für Monate (leer = alle Monate)
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {monthNames.map((month, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleEditIncomeMonth(index + 1)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                editIncomeForm.months.includes(index + 1)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {month}
                            </button>
                          ))}
                        </div>
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
                    // Normal-Ansicht
                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 group">
                      <div className="flex-1">
                        <p className="font-medium">{income.name}</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(income.amount)}
                        </p>
                        {income.months && income.months.length > 0 && (
                          <p className="text-sm text-white/60 mt-1">
                            Monate: {income.months.map((m) => monthNames[m - 1]).join(', ')}
                          </p>
                        )}
                        {(!income.months || income.months.length === 0) && !income.specificMonths && (
                          <p className="text-sm text-white/60 mt-1">
                            Alle Monate
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditIncome(income)}
                          className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {incomes.length === 0 && (
                <p className="text-white/60 text-center py-8">Noch keine Einnahmen erfasst</p>
              )}
            </div>
          </div>
        </div>

        {/* Fixkosten */}
        <div>
          {/* Monatswähler - nur zur Filterung */}
          <div className="card mb-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <h3 className="text-xl font-bold mb-4 text-purple-300">📅 Filter: Fixkosten anzeigen für</h3>
            <div className="grid grid-cols-2 gap-4">
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
            <p className="text-sm text-white/60 mt-3">
              Zeige {filteredFixedCosts.length} Fixkosten für {getMonthName(selectedMonth)} {selectedYear}
            </p>
          </div>

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
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gilt für Monate (leer = alle Monate)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleFixedCostMonth(index + 1)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        newFixedCost.months.includes(index + 1)
                          ? 'bg-red-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">
                Fixkosten hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-red-300">Ihre Fixkosten für {getMonthName(selectedMonth)} {selectedYear}</h3>
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
                      // Edit-Formular
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
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Gilt für Monate (leer = alle Monate)
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {monthNames.map((month, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => toggleEditFixedCostMonth(index + 1)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  editFixedCostForm.months.includes(index + 1)
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                {month}
                              </button>
                            ))}
                          </div>
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
                      // Normal-Ansicht
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
                          {cost.months && cost.months.length > 0 && (
                            <p className="text-sm text-white/60 mt-1">
                              Monate: {cost.months.map((m) => monthNames[m - 1]).join(', ')}
                            </p>
                          )}
                          {(!cost.months || cost.months.length === 0) && !cost.yearMonth && (
                            <p className="text-sm text-white/60 mt-1">
                              Alle Monate
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFixedCost(cost);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 transition-opacity"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFixedCost(cost.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredFixedCosts.length === 0 && (
                <p className="text-white/60 text-center py-8">Keine Fixkosten für {getMonthName(selectedMonth)} {selectedYear}</p>
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
            {/* Monat löschen */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-bold text-orange-300 mb-4">Ausgaben eines Monats löschen</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monat</label>
                    <select
                      value={deleteMonth}
                      onChange={(e) => setDeleteMonth(parseInt(e.target.value))}
                      className="select w-full"
                      disabled={deleting}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {getMonthName(i)}
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
                      disabled={deleting}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
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
                  onClick={handleDeleteMonthExpenses}
                  disabled={deleting}
                  className="w-full bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Wird gelöscht...' : `${getMonthName(deleteMonth)} ${deleteYear} löschen`}
                </button>
              </div>
            </div>

            {/* Alle Ausgaben löschen */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-300 mb-4">🚨 Alle Ausgaben löschen</h3>
              <p className="text-white/60 text-sm mb-4">
                Diese Aktion löscht ALLE Ihre Ausgaben unwiderruflich. Fixkosten und Einnahmen bleiben erhalten.
              </p>
              <button
                onClick={handleDeleteAllExpenses}
                disabled={deleting}
                className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-500/50"
              >
                {deleting ? 'Wird gelöscht...' : 'ALLE Ausgaben löschen'}
              </button>
              <p className="text-red-400/70 text-xs mt-2 text-center">
                ⚠️ Diese Aktion erfordert doppelte Bestätigung
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
