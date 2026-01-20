import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Expense, FixedCost, Income, ExpenseCategory, KeywordFilter, ExpenseArea } from '../types';
import {
  getExpenses,
  getFixedCosts,
  getIncomes,
  subscribeToKeywordFilters,
  addKeywordFilter,
  updateKeywordFilter,
  deleteKeywordFilter,
  subscribeToExpenseAreas,
  getExpensesForYear
} from '../services/firestore';
import { formatCurrency, getMonthName } from '../utils/dateUtils';
import AreaManager from '../components/AreaManager';
import AreaMonthlyStats from '../components/AreaMonthlyStats';
import AreaYearlyStats from '../components/AreaYearlyStats';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(0); // Januar
  const [selectedYear, setSelectedYear] = useState(2026);
  const [alltagSortBy, setAlltagSortBy] = useState<'date' | 'amount-desc' | 'amount-asc'>('date');
  const [sonderpostenSortBy, setSonderpostenSortBy] = useState<'date' | 'amount-desc' | 'amount-asc'>('date');
  const [alltagExpanded, setAlltagExpanded] = useState(false);
  const [sonderpostenExpanded, setSonderpostenExpanded] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [keywordFilters, setKeywordFilters] = useState<KeywordFilter[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [editingKeyword, setEditingKeyword] = useState<KeywordFilter | null>(null);
  const [editKeywordText, setEditKeywordText] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [expenseAreas, setExpenseAreas] = useState<ExpenseArea[]>([]);
  const [yearExpenses, setYearExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [exp, fixed, inc] = await Promise.all([
        getExpenses(user.uid, selectedMonth, selectedYear),
        getFixedCosts(user.uid),
        getIncomes(user.uid)
      ]);

      setExpenses(exp);
      setFixedCosts(fixed);
      setIncomes(inc);
    };

    loadData();
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToKeywordFilters(user.uid, setKeywordFilters);
    return () => unsubscribe();
  }, [user]);

  // ExpenseAreas laden
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToExpenseAreas(user.uid, setExpenseAreas);
    return () => unsubscribe();
  }, [user]);

  // Jahres-Expenses für Jahresstatistik laden
  useEffect(() => {
    if (!user) return;
    const loadYearExpensesData = async () => {
      const exp = await getExpensesForYear(user.uid, selectedYear);
      setYearExpenses(exp);
    };
    loadYearExpensesData();
  }, [user, selectedYear]);

  const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1); // YYYYMM

  const totalIncome = incomes
    .filter((income) => income.yearMonth === selectedYearMonth)
    .reduce((sum, income) => sum + income.amount, 0);

  const monthlyFixedCosts = fixedCosts
    .filter((cost) => cost.yearMonth === selectedYearMonth)
    .reduce((sum, cost) => sum + cost.amount, 0);

  const sortExpenses = (expenseList: Expense[], sortBy: 'date' | 'amount-desc' | 'amount-asc') => {
    const sorted = [...expenseList];
    switch (sortBy) {
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'date':
      default:
        return sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
  };

  const expensesByCategory: Record<ExpenseCategory, Expense[]> = {
    Alltag: sortExpenses(expenses.filter((e) => e.category === 'Alltag'), alltagSortBy),
    Sonderposten: sortExpenses(expenses.filter((e) => e.category === 'Sonderposten'), sonderpostenSortBy)
  };

  const totalAlltagExpenses = expensesByCategory.Alltag.reduce((sum, e) => sum + e.amount, 0);
  const totalSonderpostenExpenses = expensesByCategory.Sonderposten.reduce((sum, e) => sum + e.amount, 0);
  const totalVariableExpenses = totalAlltagExpenses + totalSonderpostenExpenses;

  const balance = totalIncome - monthlyFixedCosts - totalVariableExpenses;

  // Keyword Filter Handlers
  const handleAddKeyword = async () => {
    if (!user || !newKeyword.trim()) return;
    try {
      await addKeywordFilter({
        keyword: newKeyword.trim(),
        userId: user.uid
      });
      setNewKeyword('');
    } catch (error) {
      console.error('Error adding keyword:', error);
    }
  };

  const handleEditKeyword = (filter: KeywordFilter) => {
    setEditingKeyword(filter);
    setEditKeywordText(filter.keyword);
  };

  const handleSaveKeyword = async () => {
    if (!editingKeyword || !editKeywordText.trim()) return;
    try {
      await updateKeywordFilter(editingKeyword.id, { keyword: editKeywordText.trim() });
      setEditingKeyword(null);
      setEditKeywordText('');
    } catch (error) {
      console.error('Error updating keyword:', error);
    }
  };

  const handleDeleteKeyword = async (filterId: string) => {
    if (!confirm('Möchten Sie dieses Schlagwort wirklich löschen?')) return;
    try {
      await deleteKeywordFilter(filterId);
      if (selectedKeywords.includes(filterId)) {
        setSelectedKeywords(selectedKeywords.filter(id => id !== filterId));
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
    }
  };

  // Filter expenses by selected keywords (match ANY of the selected keywords)
  const keywordExpenses = selectedKeywords.length > 0
    ? expenses.filter((expense) => {
        return selectedKeywords.some(selectedId => {
          const filter = keywordFilters.find(f => f.id === selectedId);
          if (!filter) return false;
          return expense.description.toLowerCase().includes(filter.keyword.toLowerCase());
        });
      })
    : [];

  const keywordExpensesTotal = keywordExpenses.reduce((sum, e) => sum + e.amount, 0);

  const loadYearExpenses = async () => {
    if (!user) return [];
    const allExpenses: Expense[] = [];
    for (let month = 0; month < 12; month++) {
      const monthExpenses = await getExpenses(user.uid, month, selectedYear);
      allExpenses.push(...monthExpenses);
    }
    return allExpenses;
  };

  const [yearData, setYearData] = useState<{ totalIncome: number; totalExpenses: number; balance: number }>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });

  useEffect(() => {
    const loadYearData = async () => {
      if (!user) return;

      const allYearExpenses = await loadYearExpenses();
      const yearTotalExpenses = (allYearExpenses || []).reduce((sum, e) => sum + e.amount, 0);

      // IST-Werte: Nur Monate berücksichtigen, für die tatsächlich Ausgaben vorhanden sind
      // Finde heraus, in welchen Monaten Ausgaben vorhanden sind
      const monthsWithExpenses = new Set<number>();
      allYearExpenses?.forEach((expense) => {
        const expenseMonth = expense.date.getMonth() + 1; // 1-12
        monthsWithExpenses.add(expenseMonth);
      });

      let yearFixedCosts = 0;
      let yearTotalIncome = 0;

      // Nur für Monate rechnen, in denen tatsächlich Ausgaben vorhanden sind
      monthsWithExpenses.forEach((month) => {
        const yearMonth = selectedYear * 100 + month; // YYYYMM

        // Fixkosten für diesen Monat
        const monthFixedCosts = fixedCosts
          .filter((cost) => cost.yearMonth === yearMonth)
          .reduce((sum, cost) => sum + cost.amount, 0);
        yearFixedCosts += monthFixedCosts;

        // Einnahmen für diesen Monat
        const monthIncomes = incomes
          .filter((income) => income.yearMonth === yearMonth)
          .reduce((sum, income) => sum + income.amount, 0);
        yearTotalIncome += monthIncomes;
      });

      setYearData({
        totalIncome: yearTotalIncome,
        totalExpenses: yearTotalExpenses + yearFixedCosts,
        balance: yearTotalIncome - yearTotalExpenses - yearFixedCosts
      });
    };

    loadYearData();
  }, [user, selectedYear, fixedCosts, incomes]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Auswertung
      </h1>

      {/* Month Selector */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Monat</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select w-full"
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
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select w-full"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <h2 className="text-3xl font-bold mb-6 text-purple-300">
        {getMonthName(selectedMonth)} {selectedYear}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <h3 className="text-sm font-semibold text-green-300 mb-2">Einnahmen</h3>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
          <h3 className="text-sm font-semibold text-red-300 mb-2">Fixkosten</h3>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(monthlyFixedCosts)}</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <h3 className="text-sm font-semibold text-orange-300 mb-2">Variable Ausgaben</h3>
          <p className="text-3xl font-bold text-orange-400">{formatCurrency(totalVariableExpenses)}</p>
          <p className="text-xs text-white/60 mt-2">
            Alltag: {formatCurrency(totalAlltagExpenses)} | Sonderposten: {formatCurrency(totalSonderpostenExpenses)}
          </p>
        </div>

        <div className={`card bg-gradient-to-br ${
          balance >= 0
            ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
            : 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
        }`}>
          <h3 className={`text-sm font-semibold ${balance >= 0 ? 'text-blue-300' : 'text-purple-300'} mb-2`}>
            Bilanz
          </h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-purple-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Area Manager */}
      <AreaManager areas={expenseAreas} expenses={yearExpenses} />

      {/* Area Monthly Stats */}
      <AreaMonthlyStats
        expenses={expenses}
        areas={expenseAreas}
        yearMonth={selectedYearMonth}
        fixedCosts={fixedCosts.filter(fc => fc.yearMonth === selectedYearMonth)}
      />

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <div
            className="flex items-center justify-between mb-2 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
            onClick={() => setAlltagExpanded(!alltagExpanded)}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-blue-300">Alltag ({expensesByCategory.Alltag.length})</h3>
              <span className="text-white/30 text-sm">{alltagExpanded ? '▲' : '▼'}</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{formatCurrency(totalAlltagExpenses)}</p>
          </div>

          {alltagExpanded && (
            <>
              <div className="flex justify-end mb-2">
                <select
                  value={alltagSortBy}
                  onChange={(e) => setAlltagSortBy(e.target.value as 'date' | 'amount-desc' | 'amount-asc')}
                  className="select text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="date">Nach Datum</option>
                  <option value="amount-desc">Betrag ↓</option>
                  <option value="amount-asc">Betrag ↑</option>
                </select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {expensesByCategory.Alltag.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-white/60">
                        {new Date(expense.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <p className="font-bold text-blue-400">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
                {expensesByCategory.Alltag.length === 0 && (
                  <p className="text-white/60 text-center py-8">Keine Ausgaben in dieser Kategorie</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div
            className="flex items-center justify-between mb-2 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
            onClick={() => setSonderpostenExpanded(!sonderpostenExpanded)}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-orange-300">Sonderposten ({expensesByCategory.Sonderposten.length})</h3>
              <span className="text-white/30 text-sm">{sonderpostenExpanded ? '▲' : '▼'}</span>
            </div>
            <p className="text-xl font-bold text-orange-400">{formatCurrency(totalSonderpostenExpenses)}</p>
          </div>

          {sonderpostenExpanded && (
            <>
              <div className="flex justify-end mb-2">
                <select
                  value={sonderpostenSortBy}
                  onChange={(e) => setSonderpostenSortBy(e.target.value as 'date' | 'amount-desc' | 'amount-asc')}
                  className="select text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="date">Nach Datum</option>
                  <option value="amount-desc">Betrag ↓</option>
                  <option value="amount-asc">Betrag ↑</option>
                </select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {expensesByCategory.Sonderposten.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-white/60">
                        {new Date(expense.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <p className="font-bold text-orange-400">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
                {expensesByCategory.Sonderposten.length === 0 && (
                  <p className="text-white/60 text-center py-8">Keine Ausgaben in dieser Kategorie</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyword Filter Section */}
      <h2 className="text-3xl font-bold mb-6 mt-12 text-purple-300">Ausgaben nach Schlagworten</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Keyword Management */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-cyan-300">Schlagworte verwalten</h3>

          {/* Add Keyword */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                className="input flex-1"
                placeholder="Neues Schlagwort eingeben..."
              />
              <button
                onClick={handleAddKeyword}
                className="btn-primary"
                disabled={!newKeyword.trim()}
              >
                + Hinzufügen
              </button>
            </div>
          </div>

          {/* Keyword List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {keywordFilters.map((filter) => (
              <div key={filter.id}>
                {editingKeyword?.id === filter.id ? (
                  <div className="bg-white/10 rounded-lg p-3 space-y-2">
                    <input
                      type="text"
                      value={editKeywordText}
                      onChange={(e) => setEditKeywordText(e.target.value)}
                      className="input w-full"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSaveKeyword} className="btn-primary flex-1 text-sm">
                        ✓ Speichern
                      </button>
                      <button
                        onClick={() => setEditingKeyword(null)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-all ${
                      selectedKeywords.includes(filter.id)
                        ? 'bg-cyan-500/20 border-2 border-cyan-500/50'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                    }`}
                    onClick={() => {
                      if (selectedKeywords.includes(filter.id)) {
                        setSelectedKeywords(selectedKeywords.filter(id => id !== filter.id));
                      } else {
                        setSelectedKeywords([...selectedKeywords, filter.id]);
                      }
                    }}
                  >
                    <div className="flex-1 flex items-center gap-2">
                      {selectedKeywords.includes(filter.id) && <span className="text-cyan-400">✓</span>}
                      <p className="font-medium">{filter.keyword}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditKeyword(filter);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKeyword(filter.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {keywordFilters.length === 0 && (
              <p className="text-white/60 text-center py-8">
                Noch keine Schlagworte gespeichert
              </p>
            )}
          </div>
        </div>

        {/* Keyword Results */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-cyan-300">
            Gefundene Ausgaben {selectedKeywords.length > 0 && `(${keywordExpenses.length})`}
          </h3>

          {selectedKeywords.length > 0 ? (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {keywordExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-white/60">
                        {new Date(expense.date).toLocaleDateString('de-DE')} - {expense.category}
                      </p>
                    </div>
                    <p className="font-bold text-cyan-400">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
                {keywordExpenses.length === 0 && (
                  <p className="text-white/60 text-center py-8">
                    Keine Ausgaben mit diesem Schlagwort gefunden
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-right text-xl font-bold text-cyan-400">
                  Gesamt: {formatCurrency(keywordExpensesTotal)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-white/60 text-center py-8">
              Wählen Sie ein oder mehrere Schlagworte aus, um passende Ausgaben zu sehen
            </p>
          )}
        </div>
      </div>

      {/* Year Overview */}
      <h2 className="text-3xl font-bold mb-6 text-purple-300">Jahresübersicht {selectedYear}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <h3 className="text-sm font-semibold text-green-300 mb-2">Einnahmen (Jahr)</h3>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(yearData.totalIncome)}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
          <h3 className="text-sm font-semibold text-red-300 mb-2">Ausgaben (Jahr)</h3>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(yearData.totalExpenses)}</p>
        </div>

        <div className={`card bg-gradient-to-br ${
          yearData.balance >= 0
            ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
            : 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
        }`}>
          <h3 className={`text-sm font-semibold ${yearData.balance >= 0 ? 'text-blue-300' : 'text-purple-300'} mb-2`}>
            Jahresbilanz
          </h3>
          <p className={`text-3xl font-bold ${yearData.balance >= 0 ? 'text-blue-400' : 'text-purple-400'}`}>
            {formatCurrency(yearData.balance)}
          </p>
        </div>
      </div>

      {/* Area Yearly Stats */}
      <AreaYearlyStats
        expenses={yearExpenses}
        areas={expenseAreas}
        year={selectedYear}
        fixedCosts={fixedCosts.filter(fc => Math.floor(fc.yearMonth / 100) === selectedYear)}
      />
    </div>
  );
};

export default Analytics;
