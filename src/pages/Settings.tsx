import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FixedCost, Income } from '../types';
import {
  addFixedCost,
  addIncome,
  deleteFixedCost,
  deleteIncome,
  subscribeToFixedCosts,
  subscribeToIncomes
} from '../services/firestore';
import { formatCurrency } from '../utils/dateUtils';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  const [newFixedCost, setNewFixedCost] = useState({ name: '', amount: '', months: [] as number[] });
  const [newIncome, setNewIncome] = useState({ name: '', amount: '' });

  const monthNames = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
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

  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addFixedCost({
      name: newFixedCost.name,
      amount: parseFloat(newFixedCost.amount),
      months: newFixedCost.months.length > 0 ? newFixedCost.months : undefined,
      userId: user.uid
    });

    setNewFixedCost({ name: '', amount: '', months: [] });
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addIncome({
      name: newIncome.name,
      amount: parseFloat(newIncome.amount),
      userId: user.uid
    });

    setNewIncome({ name: '', amount: '' });
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

  const toggleMonth = (month: number) => {
    setNewFixedCost((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort((a, b) => a - b);
      return { ...prev, months };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
        Einstellungen
      </h1>

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
              <button type="submit" className="btn-primary w-full">
                Einnahme hinzufügen
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-green-300">Ihre Einnahmen</h3>
            <div className="space-y-3">
              {incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium">{income.name}</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(income.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteIncome(income.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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
                  Monate (leer lassen für alle Monate)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleMonth(index + 1)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        newFixedCost.months.includes(index + 1)
                          ? 'bg-purple-600 text-white'
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
            <h3 className="text-xl font-bold mb-4 text-red-300">Ihre Fixkosten</h3>
            <div className="space-y-3">
              {fixedCosts.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{cost.name}</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(cost.amount)}
                    </p>
                    {cost.months && cost.months.length > 0 && (
                      <p className="text-sm text-white/60 mt-1">
                        Nur in: {cost.months.map((m) => monthNames[m - 1]).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFixedCost(cost.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {fixedCosts.length === 0 && (
                <p className="text-white/60 text-center py-8">Noch keine Fixkosten erfasst</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
