import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Expense, FixedCost, Income } from '../types';
import {
  subscribeToExpenses,
  subscribeToFixedCosts,
  subscribeToIncomes
} from '../services/firestore';
import ExpenseForm from '../components/ExpenseForm';
import WeekView from '../components/WeekView';
import { getWeeksInMonth, formatCurrency, getMonthName } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(0); // Januar
  const [selectedYear, setSelectedYear] = useState(2026);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  const weeks = getWeeksInMonth(selectedYear, selectedMonth);
  const selectedYearMonth = selectedYear * 100 + (selectedMonth + 1);

  useEffect(() => {
    if (!user) return;

    const unsubscribeExpenses = subscribeToExpenses(
      user.uid,
      selectedMonth,
      selectedYear,
      setExpenses
    );

    const unsubscribeFixedCosts = subscribeToFixedCosts(user.uid, setFixedCosts);
    const unsubscribeIncomes = subscribeToIncomes(user.uid, setIncomes);

    return () => {
      unsubscribeExpenses();
      unsubscribeFixedCosts();
      unsubscribeIncomes();
    };
  }, [user, selectedMonth, selectedYear]);

  // Filtere Einnahmen für den ausgewählten Monat
  const totalIncome = incomes
    .filter((income) => income.yearMonth === selectedYearMonth)
    .reduce((sum, income) => sum + income.amount, 0);

  // Filtere Fixkosten für den ausgewählten Monat
  const monthlyFixedCosts = fixedCosts
    .filter((cost) => cost.yearMonth === selectedYearMonth)
    .reduce((sum, cost) => sum + cost.amount, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const balance = totalIncome - monthlyFixedCosts - totalExpenses;

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  // Nur Trend berechnen wenn aktueller Monat ausgewählt
  const isCurrentMonth = selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
  const daysElapsed = isCurrentMonth ? currentDate.getDate() : daysInMonth;

  // Neue Trend-Berechnung: 200€ pro verbleibende Woche
  const daysRemaining = daysInMonth - daysElapsed;
  const projectedRemainingExpenses = (200 / 7) * daysRemaining;
  const projectedTotalExpenses = totalExpenses + projectedRemainingExpenses;
  const projectedBalance = totalIncome - monthlyFixedCosts - projectedTotalExpenses;

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Dashboard - {getMonthName(selectedMonth)} {selectedYear}
      </h1>

      {/* Monatswähler */}
      <div className="card mb-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <h3 className="text-xl font-bold mb-4 text-cyan-300">📅 Monat auswählen</h3>
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
      </div>

      <ExpenseForm onSuccess={() => {}} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <h3 className="text-lg font-semibold text-green-300 mb-2">Einnahmen</h3>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Ausgaben gesamt</h3>
          <p className="text-3xl font-bold text-red-400">
            {formatCurrency(monthlyFixedCosts + totalExpenses)}
          </p>
          <p className="text-sm text-white/60 mt-2">
            Fixkosten: {formatCurrency(monthlyFixedCosts)} | Variable: {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className={`card bg-gradient-to-br ${
          balance >= 0
            ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
            : 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
        }`}>
          <h3 className={`text-lg font-semibold ${balance >= 0 ? 'text-blue-300' : 'text-orange-300'} mb-2`}>
            Monatsbilanz
          </h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="card mb-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <h3 className="text-xl font-bold text-purple-300 mb-2">Trend-Prognose</h3>
        <p className="text-sm text-white/70 mb-4">
          Bisher {daysElapsed} von {daysInMonth} Tagen | Noch {daysRemaining} Tage | Prognose: {formatCurrency((200 / 7) * daysRemaining)} (ca. {formatCurrency(200 / 7)}/Tag)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-white/60">Voraussichtliche Gesamtausgaben am Monatsende</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(projectedTotalExpenses)}</p>
            <p className="text-xs text-white/50 mt-1">Bereits ausgegeben: {formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Prognostizierte Bilanz am Monatsende</p>
            <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(projectedBalance)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-purple-300">Wochenübersicht</h2>
      <div>
        {weeks.map((week, index) => {
          const weekExpenses = expenses.filter(
            (exp) => exp.date >= week.start && exp.date <= week.end
          );

          return (
            <WeekView
              key={index}
              weekNumber={index + 1}
              startDate={week.start}
              endDate={week.end}
              expenses={weekExpenses}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
