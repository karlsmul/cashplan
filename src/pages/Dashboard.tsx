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
import { getWeeksInMonth, formatCurrency, getMonthName, calculateTrend } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const weeks = getWeeksInMonth(currentYear, currentMonth);

  useEffect(() => {
    if (!user) return;

    const unsubscribeExpenses = subscribeToExpenses(
      user.uid,
      currentMonth,
      currentYear,
      setExpenses
    );

    const unsubscribeFixedCosts = subscribeToFixedCosts(user.uid, setFixedCosts);
    const unsubscribeIncomes = subscribeToIncomes(user.uid, setIncomes);

    return () => {
      unsubscribeExpenses();
      unsubscribeFixedCosts();
      unsubscribeIncomes();
    };
  }, [user, currentMonth, currentYear]);

  const totalIncome = incomes
    .filter((income) => {
      const currentYearMonth = currentYear * 100 + (currentMonth + 1); // YYYYMM

      // Prüfe zuerst spezifische Monate
      if (income.specificMonths && income.specificMonths.length > 0) {
        return income.specificMonths.includes(currentYearMonth);
      }

      // Sonst prüfe wiederkehrende Monate
      return !income.months || income.months.includes(currentMonth + 1);
    })
    .reduce((sum, income) => sum + income.amount, 0);

  const monthlyFixedCosts = fixedCosts
    .filter((cost) => {
      const currentYearMonth = currentYear * 100 + (currentMonth + 1); // YYYYMM

      // Neues Format: yearMonth (monatsspezifisch)
      if (cost.yearMonth) {
        return cost.yearMonth === currentYearMonth;
      }

      // Legacy: Prüfe spezifische Monate
      if (cost.specificMonths && cost.specificMonths.length > 0) {
        return cost.specificMonths.includes(currentYearMonth);
      }

      // Legacy: Prüfe wiederkehrende Monate
      return !cost.months || cost.months.includes(currentMonth + 1);
    })
    .reduce((sum, cost) => sum + cost.amount, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const balance = totalIncome - monthlyFixedCosts - totalExpenses;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysElapsed = currentDate.getDate();
  const expenseAmounts = expenses.map((e) => e.amount);
  const trend = calculateTrend(expenseAmounts, daysElapsed, daysInMonth);
  const projectedBalance = totalIncome - monthlyFixedCosts - trend;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Dashboard - {getMonthName(currentMonth)} {currentYear}
      </h1>

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
          Basierend auf den bisherigen {daysElapsed} Tagen von {daysInMonth} Tagen
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-white/60">Voraussichtliche Gesamtausgaben</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(trend)}</p>
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
