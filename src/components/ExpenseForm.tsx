import React, { useState } from 'react';
import { ExpenseCategory } from '../types';
import { addExpense } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';
import AutocompleteInput from './AutocompleteInput';

interface ExpenseFormProps {
  onSuccess: () => void;
  descriptionSuggestions?: string[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, descriptionSuggestions = [] }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Alltag');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await addExpense({
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
        userId: user.uid
      });

      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSuccess();
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen der Ausgabe:', error);
      setError(error.message || 'Fehler beim Speichern. Bitte überprüfen Sie die Firestore-Regeln.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6 relative z-10">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Neue Ausgabe erfassen
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Betrag (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="99999.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input w-full"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-full"
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
          <AutocompleteInput
            value={description}
            onChange={setDescription}
            suggestions={descriptionSuggestions}
            className="input w-full"
            placeholder="z.B. Einkauf, Tanken..."
            maxLength={200}
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
          ✅ Ausgabe erfolgreich gespeichert!
        </div>
      )}

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
