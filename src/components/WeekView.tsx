import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { deleteExpense, updateExpense } from '../services/firestore';

interface WeekViewProps {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  expenses: Expense[];
}

const WeekView: React.FC<WeekViewProps> = ({ weekNumber, startDate, endDate, expenses }) => {
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', description: '', category: 'Alltag' as ExpenseCategory, date: '' });
  const [sortBy, setSortBy] = useState<'date' | 'amount-desc' | 'amount-asc'>('date');

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

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    try {
      await updateExpense(editingExpense.id, {
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        category: editForm.category,
        date: new Date(editForm.date)
      });
      setEditingExpense(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Ausgabe:', error);
      alert('Fehler beim Aktualisieren der Ausgabe. Bitte versuchen Sie es erneut.');
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  // Sortier-Funktion
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

  // Wochensumme nur aus "Alltag"-Ausgaben berechnen
  const weekTotal = expenses
    .filter(exp => exp.category === 'Alltag')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByDay = sortExpenses(expenses).reduce((acc, expense) => {
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
          <p className={`text-2xl font-bold ${weekTotal > 200 ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(weekTotal)}
          </p>
          <p className="text-sm text-white/60">
            {expenses.length} {expenses.length === 1 ? 'Ausgabe' : 'Ausgaben'}
          </p>
          <p className="text-xs text-white/50">
            Nur Alltag-Ausgaben
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
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <p className="text-sm text-white/60">Sortierung:</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount-desc' | 'amount-asc')}
              className="select text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="date">Nach Datum</option>
              <option value="amount-desc">Betrag ↓</option>
              <option value="amount-asc">Betrag ↑</option>
            </select>
          </div>
          {Object.entries(expensesByDay).map(([date, dayExpenses]) => (
            <div key={date} className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-purple-300 mb-2">{date}</p>
              <div className="space-y-2">
                {dayExpenses.map((expense) => (
                  <div key={expense.id}>
                    {editingExpense?.id === expense.id ? (
                      // Edit-Formular
                      <div className="bg-white/10 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Betrag (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Datum</label>
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="input w-full text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">Beschreibung</label>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="input w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">Kategorie</label>
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ExpenseCategory })}
                            className="select w-full text-sm"
                          >
                            <option value="Alltag">Alltag</option>
                            <option value="Sonderposten">Sonderposten</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="btn-primary flex-1 text-sm py-2"
                          >
                            ✓ Speichern
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal-Ansicht
                      <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 group">
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
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-red-400">
                            -{formatCurrency(expense.amount)}
                          </p>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded-lg text-sm font-medium"
                            title="Ausgabe bearbeiten"
                          >
                            ✏️
                          </button>
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
                    )}
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
