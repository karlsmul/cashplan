import React, { useState } from 'react';
import { ExpenseCategory } from '../types';
import { addExpense } from '../services/firestore';
import { useAuth } from '../hooks/useAuth';

const ExpenseForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Alltag');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(),
        userId: user.uid
      });

      setAmount('');
      setDescription('');
      onSuccess();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Ausgabe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Neue Ausgabe erfassen
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Betrag (€)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input w-full"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="select w-full"
          >
            <option value="Alltag">Alltag</option>
            <option value="Sonderposten">Sonderposten</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Beschreibung</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full"
            placeholder="z.B. Einkauf, Tanken..."
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-4 w-full md:w-auto"
      >
        {loading ? 'Wird gespeichert...' : 'Ausgabe hinzufügen'}
      </button>
    </form>
  );
};

export default ExpenseForm;
