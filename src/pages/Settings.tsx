import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FixedCost, Income, UserSettings, StorageMode, RecurrenceType } from '../types';
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
  deleteExpensesForMonth,
  subscribeToUserSettings,
  updateUserSettings
} from '../services/firestore';
import { formatCurrency, getMonthName } from '../utils/dateUtils';

const Settings: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [weeklyBudgetInput, setWeeklyBudgetInput] = useState('');

  // Monatswähler
  const [selectedMonth, setSelectedMonth] = useState(0); // Januar
  const [selectedYear, setSelectedYear] = useState(2026);
  const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1);

  const [newFixedCost, setNewFixedCost] = useState({
    name: '',
    amount: '',
    recurrence: 'monthly' as RecurrenceType,
    recurrenceMonths: [] as number[]
  });
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });

  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncomeForm, setEditIncomeForm] = useState({ name: '', amount: '' });
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editFixedCostForm, setEditFixedCostForm] = useState({
    name: '',
    amount: '',
    recurrence: 'monthly' as RecurrenceType,
    recurrenceMonths: [] as number[]
  });

  // Sortierung
  const [incomeSortBy, setIncomeSortBy] = useState<'name' | 'amount-desc' | 'amount-asc'>('name');
  const [fixedCostSortBy, setFixedCostSortBy] = useState<'name' | 'amount-desc' | 'amount-asc'>('amount-desc');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteMonth, setDeleteMonth] = useState(new Date().getMonth());
  const [deleteYear, setDeleteYear] = useState(new Date().getFullYear());
  const [deleting, setDeleting] = useState(false);

  // Passwort ändern
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Speichermodus
  const [storageModeChanging, setStorageModeChanging] = useState(false);
  const [storageModeSuccess, setStorageModeSuccess] = useState('');

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  // Wiederholungs-Labels
  const recurrenceLabels: Record<RecurrenceType, string> = {
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich',
    yearly: 'Jährlich',
    once: 'Einmalig'
  };

  const recurrenceColors: Record<RecurrenceType, string> = {
    monthly: 'bg-blue-500/20 text-blue-300',
    quarterly: 'bg-purple-500/20 text-purple-300',
    yearly: 'bg-yellow-500/20 text-yellow-300',
    once: 'bg-gray-500/20 text-gray-300'
  };

  // Toggle-Funktion für Monats-Auswahl
  const toggleMonth = (
    month: number,
    currentMonths: number[],
    setter: (months: number[]) => void
  ) => {
    if (currentMonths.includes(month)) {
      setter(currentMonths.filter(m => m !== month));
    } else {
      setter([...currentMonths, month].sort((a, b) => a - b));
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribeFixedCosts = subscribeToFixedCosts(user.uid, setFixedCosts);
    const unsubscribeIncomes = subscribeToIncomes(user.uid, setIncomes);
    const unsubscribeSettings = subscribeToUserSettings(user.uid, (settings) => {
      setUserSettings(settings);
      setWeeklyBudgetInput(settings.weeklyBudget.toString());
    });

    return () => {
      unsubscribeFixedCosts();
      unsubscribeIncomes();
      unsubscribeSettings();
    };
  }, [user]);

  // Handler: Wochenlimit speichern
  const handleSaveWeeklyBudget = async () => {
    if (!userSettings) return;

    const newBudget = parseFloat(weeklyBudgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein.');
      return;
    }

    try {
      await updateUserSettings(userSettings.id, { weeklyBudget: newBudget });
      setSuccess('Wochenlimit erfolgreich gespeichert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Speichern des Wochenlimits.');
    }
  };

  // Passwort-Validierung
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Mindestens 8 Zeichen erforderlich' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Mindestens ein Großbuchstabe erforderlich' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Mindestens ein Kleinbuchstabe erforderlich' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Mindestens eine Zahl erforderlich' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Mindestens ein Sonderzeichen erforderlich' };
    }
    return { valid: true, message: '' };
  };

  // Handler: Passwort ändern
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validierung
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setPasswordError(validation.message);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordError('Das aktuelle Passwort ist falsch');
      } else {
        setPasswordError(error.message || 'Fehler beim Ändern des Passworts');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Handler: Speichermodus ändern
  const handleStorageModeChange = async (newMode: StorageMode) => {
    if (!userSettings) return;

    // Warnung anzeigen wenn von Cloud zu Lokal gewechselt wird
    if (newMode === 'local') {
      const confirmed = window.confirm(
        '⚠️ ACHTUNG: Lokaler Speichermodus\n\n' +
        'Bei lokaler Speicherung:\n' +
        '• Daten werden NUR auf diesem Gerät gespeichert\n' +
        '• Kein Sync zwischen Geräten möglich\n' +
        '• Bei Geräteverlust sind alle Daten verloren\n' +
        '• Regelmäßige Backups empfohlen\n\n' +
        'Bereits in der Cloud gespeicherte Daten bleiben dort erhalten.\n\n' +
        'Möchten Sie wirklich zum lokalen Modus wechseln?'
      );
      if (!confirmed) return;
    }

    setStorageModeChanging(true);
    try {
      await updateUserSettings(userSettings.id, { storageMode: newMode });
      setStorageModeSuccess(
        newMode === 'cloud'
          ? 'Cloud-Speicherung aktiviert. Ihre Daten werden synchronisiert.'
          : 'Lokale Speicherung aktiviert. Neue Daten werden nur auf diesem Gerät gespeichert.'
      );
      setTimeout(() => setStorageModeSuccess(''), 5000);
    } catch (error: any) {
      setError(error.message || 'Fehler beim Ändern des Speichermodus');
    } finally {
      setStorageModeChanging(false);
    }
  };

  // Handler: Fixkosten hinzufügen
  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const fixedCostData: Omit<FixedCost, 'id'> = {
        name: newFixedCost.name,
        amount: parseFloat(newFixedCost.amount),
        yearMonth: selectedYearMonth,
        userId: user.uid,
        recurrence: newFixedCost.recurrence,
        recurrenceMonths: newFixedCost.recurrenceMonths.length > 0 ? newFixedCost.recurrenceMonths : []
      };

      await addFixedCost(fixedCostData);

      setNewFixedCost({ name: '', amount: '', recurrence: 'monthly', recurrenceMonths: [] });
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
    setEditFixedCostForm({
      name: cost.name,
      amount: cost.amount.toString(),
      recurrence: cost.recurrence || 'monthly',
      recurrenceMonths: cost.recurrenceMonths || []
    });
  };

  const handleSaveFixedCost = async () => {
    if (!editingFixedCost) return;

    try {
      const updateData: Partial<FixedCost> = {
        name: editFixedCostForm.name,
        amount: parseFloat(editFixedCostForm.amount),
        recurrence: editFixedCostForm.recurrence
      };

      // Nur recurrenceMonths setzen wenn es Werte gibt
      if (editFixedCostForm.recurrenceMonths.length > 0) {
        updateData.recurrenceMonths = editFixedCostForm.recurrenceMonths;
      } else {
        // Leeres Array für Firestore-Kompatibilität
        updateData.recurrenceMonths = [];
      }

      await updateFixedCost(editingFixedCost.id, updateData);
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

  // Sortier-Funktionen
  const sortIncomes = (incomeList: Income[]) => {
    const sorted = [...incomeList];
    switch (incomeSortBy) {
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const sortFixedCosts = (costList: FixedCost[]) => {
    const sorted = [...costList];
    switch (fixedCostSortBy) {
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  // Filtere für ausgewählten Monat und sortiere
  const filteredFixedCosts = sortFixedCosts(fixedCosts.filter((cost) => cost.yearMonth === selectedYearMonth));
  const filteredIncomes = sortIncomes(incomes.filter((income) => income.yearMonth === selectedYearMonth));

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
          📋 Vormonat kopieren
        </button>
      </div>

      {/* Budget-Einstellungen */}
      <div className="card mb-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <h3 className="text-xl font-bold mb-4 text-yellow-300">💰 Wochenlimit</h3>
        <p className="text-sm text-white/60 mb-4">
          Wochenausgaben werden rot markiert, wenn sie diesen Betrag überschreiten.
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Betrag (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="99999.99"
              value={weeklyBudgetInput}
              onChange={(e) => setWeeklyBudgetInput(e.target.value)}
              className="input w-full"
              placeholder="200.00"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSaveWeeklyBudget}
              className="btn-primary px-6"
            >
              Speichern
            </button>
          </div>
        </div>
        {userSettings && (
          <p className="text-xs text-white/50 mt-2">
            Aktuelles Limit: {formatCurrency(userSettings.weeklyBudget)}
          </p>
        )}
      </div>

      {/* Datenschutz & Speicherung */}
      <div className="card mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <h3 className="text-xl font-bold mb-4 text-blue-300">🔒 Datenschutz & Speicherung</h3>
        <p className="text-sm text-white/60 mb-4">
          Wählen Sie, wo Ihre Finanzdaten gespeichert werden sollen.
        </p>

        <div className="space-y-3">
          {/* Cloud Option */}
          <label
            className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
              userSettings?.storageMode === 'cloud'
                ? 'bg-blue-500/20 border-2 border-blue-400'
                : 'bg-white/5 border-2 border-transparent hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="storageMode"
              value="cloud"
              checked={userSettings?.storageMode === 'cloud'}
              onChange={() => handleStorageModeChange('cloud')}
              disabled={storageModeChanging}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-300">☁️ Cloud-Speicherung</span>
                <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">Empfohlen</span>
              </div>
              <p className="text-sm text-white/60 mt-1">
                Daten werden sicher in der Cloud (Firebase) gespeichert.
              </p>
              <ul className="text-xs text-white/50 mt-2 space-y-1">
                <li>✓ Sync zwischen allen Geräten</li>
                <li>✓ Automatische Backups</li>
                <li>✓ Daten sicher bei Geräteverlust</li>
              </ul>
            </div>
          </label>

          {/* Lokal Option */}
          <label
            className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
              userSettings?.storageMode === 'local'
                ? 'bg-orange-500/20 border-2 border-orange-400'
                : 'bg-white/5 border-2 border-transparent hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="storageMode"
              value="local"
              checked={userSettings?.storageMode === 'local'}
              onChange={() => handleStorageModeChange('local')}
              disabled={storageModeChanging}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-300">📱 Nur lokale Speicherung</span>
              </div>
              <p className="text-sm text-white/60 mt-1">
                Daten werden nur auf diesem Gerät gespeichert (IndexedDB).
              </p>
              <ul className="text-xs text-white/50 mt-2 space-y-1">
                <li>✓ Maximaler Datenschutz</li>
                <li>✓ Keine Cloud-Verbindung nötig</li>
                <li>⚠️ Kein Sync zwischen Geräten</li>
                <li>⚠️ Datenverlust bei Geräteverlust möglich</li>
              </ul>
            </div>
          </label>
        </div>

        {storageModeChanging && (
          <p className="text-sm text-white/60 mt-4">Speichermodus wird geändert...</p>
        )}

        {storageModeSuccess && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm mt-4">
            {storageModeSuccess}
          </div>
        )}

        <p className="text-xs text-white/40 mt-4">
          Hinweis: Bereits gespeicherte Daten werden nicht automatisch migriert.
          Bei Wechsel des Speichermodus bleiben bestehende Daten an ihrem Ort erhalten.
        </p>
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
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999999.99"
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-300">
                Einnahmen für {getMonthName(selectedMonth)} {selectedYear}
              </h3>
              <select
                value={incomeSortBy}
                onChange={(e) => setIncomeSortBy(e.target.value as 'name' | 'amount-desc' | 'amount-asc')}
                className="select text-sm"
              >
                <option value="name">Nach Name</option>
                <option value="amount-desc">Betrag ↓</option>
                <option value="amount-asc">Betrag ↑</option>
              </select>
            </div>
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
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="999999.99"
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
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="99999.99"
                  value={newFixedCost.amount}
                  onChange={(e) => setNewFixedCost({ ...newFixedCost, amount: e.target.value })}
                  className="input w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wiederholung</label>
                <select
                  value={newFixedCost.recurrence}
                  onChange={(e) => setNewFixedCost({
                    ...newFixedCost,
                    recurrence: e.target.value as RecurrenceType,
                    recurrenceMonths: []
                  })}
                  className="select w-full"
                >
                  <option value="monthly">Monatlich (jeden Monat)</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="yearly">Jährlich</option>
                  <option value="once">Einmalig (wird nicht kopiert)</option>
                </select>
              </div>
              {(newFixedCost.recurrence === 'quarterly' || newFixedCost.recurrence === 'yearly') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    In welchen Monaten fällt diese Kosten an?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {monthNames.map((month, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleMonth(
                          index + 1,
                          newFixedCost.recurrenceMonths,
                          (months) => setNewFixedCost({ ...newFixedCost, recurrenceMonths: months })
                        )}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          newFixedCost.recurrenceMonths.includes(index + 1)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    {newFixedCost.recurrenceMonths.length === 0
                      ? newFixedCost.recurrence === 'quarterly'
                        ? 'Standard: Jan, Apr, Jul, Okt'
                        : 'Standard: Januar'
                      : `Ausgewählt: ${newFixedCost.recurrenceMonths.map(m => monthNames[m - 1].slice(0, 3)).join(', ')}`
                    }
                  </p>
                </div>
              )}
              <p className="text-sm text-white/60">
                Wird für {getMonthName(selectedMonth)} {selectedYear} hinzugefügt
              </p>
              <button type="submit" className="btn-primary w-full">
                Fixkosten hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-300">
                Fixkosten für {getMonthName(selectedMonth)} {selectedYear}
              </h3>
              <select
                value={fixedCostSortBy}
                onChange={(e) => setFixedCostSortBy(e.target.value as 'name' | 'amount-desc' | 'amount-asc')}
                className="select text-sm"
              >
                <option value="name">Nach Name</option>
                <option value="amount-desc">Betrag ↓</option>
                <option value="amount-asc">Betrag ↑</option>
              </select>
            </div>
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
                            maxLength={100}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Betrag (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="99999.99"
                            value={editFixedCostForm.amount}
                            onChange={(e) => setEditFixedCostForm({ ...editFixedCostForm, amount: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Wiederholung</label>
                          <select
                            value={editFixedCostForm.recurrence}
                            onChange={(e) => setEditFixedCostForm({
                              ...editFixedCostForm,
                              recurrence: e.target.value as RecurrenceType,
                              recurrenceMonths: []
                            })}
                            className="select w-full"
                          >
                            <option value="monthly">Monatlich (jeden Monat)</option>
                            <option value="quarterly">Vierteljährlich</option>
                            <option value="yearly">Jährlich</option>
                            <option value="once">Einmalig (wird nicht kopiert)</option>
                          </select>
                        </div>
                        {(editFixedCostForm.recurrence === 'quarterly' || editFixedCostForm.recurrence === 'yearly') && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Monate</label>
                            <div className="grid grid-cols-4 gap-2">
                              {monthNames.map((month, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => toggleMonth(
                                    index + 1,
                                    editFixedCostForm.recurrenceMonths,
                                    (months) => setEditFixedCostForm({ ...editFixedCostForm, recurrenceMonths: months })
                                  )}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    editFixedCostForm.recurrenceMonths.includes(index + 1)
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                                  }`}
                                >
                                  {month.slice(0, 3)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{cost.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${recurrenceColors[cost.recurrence || 'monthly']}`}>
                              {recurrenceLabels[cost.recurrence || 'monthly']}
                            </span>
                            {isPaid && (
                              <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
                                ✓ Bezahlt
                              </span>
                            )}
                          </div>
                          {cost.recurrenceMonths && cost.recurrenceMonths.length > 0 && (
                            <p className="text-xs text-white/50 mt-1">
                              Monate: {cost.recurrenceMonths.map(m => monthNames[m - 1].slice(0, 3)).join(', ')}
                            </p>
                          )}
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

      {/* Passwort ändern - nur für E-Mail-Nutzer */}
      {user?.providerData?.some(p => p.providerId === 'password') && (
        <div className="mt-8">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">🔐 Passwort ändern</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Aktuelles Passwort</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Neues Passwort</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full"
                  required
                />
                <p className="text-xs text-white/50 mt-1">
                  Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Neues Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              {passwordError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="btn-primary"
              >
                {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
              </button>
            </form>
          </div>
        </div>
      )}

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
