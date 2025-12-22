import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Expense, FixedCost, Income, ExpenseCategory } from '../types';
import { getExpenses, getFixedCosts, getIncomes } from '../services/firestore';
import { formatCurrency, getMonthName } from '../utils/dateUtils';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sortBy, setSortBy] = useState<'date' | 'amount-desc' | 'amount-asc'>('date');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

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

  const totalIncome = incomes
    .filter((income) => {
      const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1); // YYYYMM

      // Prüfe zuerst spezifische Monate
      if (income.specificMonths && income.specificMonths.length > 0) {
        return income.specificMonths.includes(selectedYearMonth);
      }

      // Sonst prüfe wiederkehrende Monate
      return !income.months || income.months.includes(selectedMonth + 1);
    })
    .reduce((sum, income) => sum + income.amount, 0);

  const monthlyFixedCosts = fixedCosts
    .filter((cost) => !cost.months || cost.months.includes(selectedMonth + 1))
    .reduce((sum, cost) => sum + cost.amount, 0);

  const sortExpenses = (expenseList: Expense[]) => {
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
    Alltag: sortExpenses(expenses.filter((e) => e.category === 'Alltag')),
    Sonderposten: sortExpenses(expenses.filter((e) => e.category === 'Sonderposten'))
  };

  const totalAlltagExpenses = expensesByCategory.Alltag.reduce((sum, e) => sum + e.amount, 0);
  const totalSonderpostenExpenses = expensesByCategory.Sonderposten.reduce((sum, e) => sum + e.amount, 0);
  const totalVariableExpenses = totalAlltagExpenses + totalSonderpostenExpenses;

  const balance = totalIncome - monthlyFixedCosts - totalVariableExpenses;

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
          .filter((cost) => !cost.months || cost.months.includes(month))
          .reduce((sum, cost) => sum + cost.amount, 0);
        yearFixedCosts += monthFixedCosts;

        // Einnahmen für diesen Monat
        const monthIncomes = incomes
          .filter((income) => {
            // Prüfe zuerst spezifische Monate
            if (income.specificMonths && income.specificMonths.length > 0) {
              return income.specificMonths.includes(yearMonth);
            }

            // Sonst prüfe wiederkehrende Monate
            return !income.months || income.months.includes(month);
          })
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium mb-2">Sortierung</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount-desc' | 'amount-asc')}
              className="select w-full"
            >
              <option value="date">Nach Datum</option>
              <option value="amount-desc">Nach Betrag (absteigend)</option>
              <option value="amount-asc">Nach Betrag (aufsteigend)</option>
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

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-blue-300">Alltag ({expensesByCategory.Alltag.length})</h3>
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
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-right text-xl font-bold text-blue-400">
              Gesamt: {formatCurrency(totalAlltagExpenses)}
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-orange-300">
            Sonderposten ({expensesByCategory.Sonderposten.length})
          </h3>
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
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-right text-xl font-bold text-orange-400">
              Gesamt: {formatCurrency(totalSonderpostenExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Year Overview */}
      <h2 className="text-3xl font-bold mb-6 text-purple-300">Jahresübersicht {selectedYear}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
};

export default Analytics;
