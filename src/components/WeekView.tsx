import React, { useState } from 'react';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { deleteExpense } from '../services/firestore';

interface WeekViewProps {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  expenses: Expense[];
}

const WeekView: React.FC<WeekViewProps> = ({ weekNumber, startDate, endDate, expenses }) => {
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (expense: Expense) => {
    if (!window.confirm(`Möchten Sie diese Ausgabe wirklich löschen?\n\n"${expense.description}" - ${formatCurrency(expense.amount)}`)) {
      return;
    }

    setDeletingId(expense.id);
    try {
      await deleteExpense(expense.id);
    } catch (error) {
      console.error('Fehler beim Löschen der Ausgabe:', error);
      alert('Fehler beim Löschen der Ausgabe. Bitte versuchen Sie es erneut.');
    } finally {
      setDeletingId(null);
    }
  };

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByDay = expenses.reduce((acc, expense) => {
    const dateKey = formatDate(expense.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="card mb-4 hover:shadow-2xl transition-all">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <h3 className="text-xl font-bold text-purple-300">
            Woche {weekNumber}
          </h3>
          <p className="text-sm text-white/60">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>

        <div className="text-right mr-4">
          <p className="text-2xl font-bold text-white">
            {formatCurrency(total)}
          </p>
          <p className="text-sm text-white/60">
            {expenses.length} {expenses.length === 1 ? 'Ausgabe' : 'Ausgaben'}
          </p>
        </div>

        <div className="text-purple-400">
          <svg
            className={`w-6 h-6 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4">
          {Object.entries(expensesByDay).map(([date, dayExpenses]) => (
            <div key={date} className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-purple-300 mb-2">{date}</p>
              <div className="space-y-2">
                {dayExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3 group"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-white/60">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            expense.category === 'Alltag'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-orange-500/20 text-orange-300'
                          }`}
                        >
                          {expense.category}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-red-400">
                        -{formatCurrency(expense.amount)}
                      </p>
                      <button
                        onClick={() => handleDelete(expense)}
                        disabled={deletingId === expense.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50"
                        title="Ausgabe löschen"
                      >
                        {deletingId === expense.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeekView;
