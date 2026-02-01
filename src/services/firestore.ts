import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  onSnapshot,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, FixedCost, Income, KeywordFilter, UserSettings, ExpenseArea, ExportData } from '../types';

// Error-Handler für Firestore-Operationen
const handleFirestoreError = (error: unknown, operation: string): never => {
  const message = error instanceof FirestoreError
    ? `Firestore-Fehler bei ${operation}: ${error.message}`
    : `Fehler bei ${operation}: ${String(error)}`;
  console.error(message, error);
  throw new Error(message);
};

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<string> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesRef, {
      ...expense,
      date: Timestamp.fromDate(expense.date)
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'addExpense');
  }
};

export const getExpenses = async (userId: string, month: number, year: number): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const q = query(
      expensesRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Expense[];

    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    return handleFirestoreError(error, 'getExpenses');
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, 'deleteExpense');
  }
};

export const updateExpense = async (expenseId: string, data: Partial<Expense>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expenses', expenseId), data);
  } catch (error) {
    handleFirestoreError(error, 'updateExpense');
  }
};

export const deleteAllExpenses = async (userId: string): Promise<void> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, 'deleteAllExpenses');
  }
};

export const deleteExpensesForMonth = async (userId: string, month: number, year: number): Promise<void> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const q = query(
      expensesRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, 'deleteExpensesForMonth');
  }
};

// Fixed Costs
export const addFixedCost = async (fixedCost: Omit<FixedCost, 'id'>): Promise<string> => {
  try {
    const fixedCostsRef = collection(db, 'fixedCosts');
    const docRef = await addDoc(fixedCostsRef, fixedCost);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'addFixedCost');
  }
};

export const getFixedCosts = async (userId: string): Promise<FixedCost[]> => {
  try {
    const fixedCostsRef = collection(db, 'fixedCosts');
    const q = query(fixedCostsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FixedCost[];
  } catch (error) {
    return handleFirestoreError(error, 'getFixedCosts');
  }
};

export const updateFixedCost = async (fixedCostId: string, data: Partial<FixedCost>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'fixedCosts', fixedCostId), data);
  } catch (error) {
    handleFirestoreError(error, 'updateFixedCost');
  }
};

export const deleteFixedCost = async (fixedCostId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'fixedCosts', fixedCostId));
  } catch (error) {
    handleFirestoreError(error, 'deleteFixedCost');
  }
};

// Incomes
export const addIncome = async (income: Omit<Income, 'id'>): Promise<string> => {
  try {
    const incomesRef = collection(db, 'incomes');
    const docRef = await addDoc(incomesRef, income);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'addIncome');
  }
};

export const getIncomes = async (userId: string): Promise<Income[]> => {
  try {
    const incomesRef = collection(db, 'incomes');
    const q = query(incomesRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[];
  } catch (error) {
    return handleFirestoreError(error, 'getIncomes');
  }
};

export const updateIncome = async (incomeId: string, data: Partial<Income>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'incomes', incomeId), data);
  } catch (error) {
    handleFirestoreError(error, 'updateIncome');
  }
};

export const deleteIncome = async (incomeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'incomes', incomeId));
  } catch (error) {
    handleFirestoreError(error, 'deleteIncome');
  }
};

// Real-time listeners mit Error-Callback
export const subscribeToExpenses = (
  userId: string,
  month: number,
  year: number,
  callback: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
) => {
  const expensesRef = collection(db, 'expenses');
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const q = query(
    expensesRef,
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Expense[];

      const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
      callback(sortedExpenses);
    },
    (error) => {
      console.error('subscribeToExpenses Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Ausgaben: ${error.message}`));
    }
  );
};

export const subscribeToFixedCosts = (
  userId: string,
  callback: (fixedCosts: FixedCost[]) => void,
  onError?: (error: Error) => void
) => {
  const fixedCostsRef = collection(db, 'fixedCosts');
  const q = query(fixedCostsRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const fixedCosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FixedCost[];
      callback(fixedCosts);
    },
    (error) => {
      console.error('subscribeToFixedCosts Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Fixkosten: ${error.message}`));
    }
  );
};

export const subscribeToFixedCostsForMonth = (
  userId: string,
  yearMonth: number,
  callback: (fixedCosts: FixedCost[]) => void,
  onError?: (error: Error) => void
) => {
  const fixedCostsRef = collection(db, 'fixedCosts');
  const q = query(
    fixedCostsRef,
    where('userId', '==', userId),
    where('yearMonth', '==', yearMonth)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const fixedCosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FixedCost[];
      callback(fixedCosts);
    },
    (error) => {
      console.error('subscribeToFixedCostsForMonth Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der monatlichen Fixkosten: ${error.message}`));
    }
  );
};

export const getFixedCostsForMonth = async (userId: string, yearMonth: number): Promise<FixedCost[]> => {
  try {
    const fixedCostsRef = collection(db, 'fixedCosts');
    const q = query(
      fixedCostsRef,
      where('userId', '==', userId),
      where('yearMonth', '==', yearMonth)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FixedCost[];
  } catch (error) {
    return handleFirestoreError(error, 'getFixedCostsForMonth');
  }
};

// Hilfsfunktion: Prüft ob eine Fixkosten für einen bestimmten Monat relevant ist
const isFixedCostRelevantForMonth = (cost: FixedCost, targetMonth: number): boolean => {
  const recurrence = cost.recurrence || 'monthly'; // Default: monatlich für Rückwärtskompatibilität

  switch (recurrence) {
    case 'monthly':
      return true; // Jeden Monat relevant

    case 'quarterly':
      // Vierteljährlich: Monate 1, 4, 7, 10 oder benutzerdefiniert
      if (cost.recurrenceMonths && cost.recurrenceMonths.length > 0) {
        return cost.recurrenceMonths.includes(targetMonth);
      }
      return [1, 4, 7, 10].includes(targetMonth); // Standard-Quartale

    case 'yearly':
      // Jährlich: Nur in bestimmten Monaten
      if (cost.recurrenceMonths && cost.recurrenceMonths.length > 0) {
        return cost.recurrenceMonths.includes(targetMonth);
      }
      return targetMonth === 1; // Standard: Januar

    case 'once':
      return false; // Einmalig: Wird nicht kopiert

    default:
      return true;
  }
};

export const copyFixedCostsFromPreviousMonth = async (
  userId: string,
  fromYearMonth: number,
  toYearMonth: number
): Promise<number> => {
  try {
    const sourceCosts = await getFixedCostsForMonth(userId, fromYearMonth);
    const targetMonth = toYearMonth % 100; // Extrahiere Monat (1-12)

    // Filtere Kosten basierend auf Wiederholungsintervall
    const relevantCosts = sourceCosts.filter(cost =>
      isFixedCostRelevantForMonth(cost, targetMonth)
    );

    const copyPromises = relevantCosts.map(async (cost) => {
      const newCost: Omit<FixedCost, 'id'> = {
        name: cost.name,
        amount: cost.amount,
        yearMonth: toYearMonth,
        userId: userId,
        recurrence: cost.recurrence,
        recurrenceMonths: cost.recurrenceMonths,
      };
      return addFixedCost(newCost);
    });

    await Promise.all(copyPromises);
    return relevantCosts.length;
  } catch (error) {
    return handleFirestoreError(error, 'copyFixedCostsFromPreviousMonth');
  }
};

export const subscribeToIncomes = (
  userId: string,
  callback: (incomes: Income[]) => void,
  onError?: (error: Error) => void
) => {
  const incomesRef = collection(db, 'incomes');
  const q = query(incomesRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const incomes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Income[];
      callback(incomes);
    },
    (error) => {
      console.error('subscribeToIncomes Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Einnahmen: ${error.message}`));
    }
  );
};

export const getIncomesForMonth = async (userId: string, yearMonth: number): Promise<Income[]> => {
  try {
    const incomesRef = collection(db, 'incomes');
    const q = query(
      incomesRef,
      where('userId', '==', userId),
      where('yearMonth', '==', yearMonth)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[];
  } catch (error) {
    return handleFirestoreError(error, 'getIncomesForMonth');
  }
};

export const copyIncomesFromPreviousMonth = async (
  userId: string,
  fromYearMonth: number,
  toYearMonth: number
): Promise<number> => {
  try {
    const sourceIncomes = await getIncomesForMonth(userId, fromYearMonth);

    const copyPromises = sourceIncomes.map(async (income) => {
      const newIncome: Omit<Income, 'id'> = {
        name: income.name,
        amount: income.amount,
        yearMonth: toYearMonth,
        userId: userId
      };
      return addIncome(newIncome);
    });

    await Promise.all(copyPromises);
    return sourceIncomes.length;
  } catch (error) {
    return handleFirestoreError(error, 'copyIncomesFromPreviousMonth');
  }
};

// Keyword Filters
export const addKeywordFilter = async (filter: Omit<KeywordFilter, 'id'>): Promise<string> => {
  try {
    const filtersRef = collection(db, 'keywordFilters');
    const docRef = await addDoc(filtersRef, filter);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'addKeywordFilter');
  }
};

export const getKeywordFilters = async (userId: string): Promise<KeywordFilter[]> => {
  try {
    const filtersRef = collection(db, 'keywordFilters');
    const q = query(filtersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as KeywordFilter[];
  } catch (error) {
    return handleFirestoreError(error, 'getKeywordFilters');
  }
};

export const updateKeywordFilter = async (filterId: string, updates: Partial<KeywordFilter>): Promise<void> => {
  try {
    const filterRef = doc(db, 'keywordFilters', filterId);
    await updateDoc(filterRef, updates);
  } catch (error) {
    handleFirestoreError(error, 'updateKeywordFilter');
  }
};

export const deleteKeywordFilter = async (filterId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'keywordFilters', filterId));
  } catch (error) {
    handleFirestoreError(error, 'deleteKeywordFilter');
  }
};

export const subscribeToKeywordFilters = (
  userId: string,
  callback: (filters: KeywordFilter[]) => void,
  onError?: (error: Error) => void
) => {
  const filtersRef = collection(db, 'keywordFilters');
  const q = query(filtersRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const filters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KeywordFilter[];
      callback(filters);
    },
    (error) => {
      console.error('subscribeToKeywordFilters Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Keyword-Filter: ${error.message}`));
    }
  );
};

// User Settings
const DEFAULT_WEEKLY_BUDGET = 200;
const DEFAULT_STORAGE_MODE = 'cloud' as const;

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const settingsRef = collection(db, 'userSettings');
    const q = query(settingsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Erstelle Default-Settings
      const defaultSettings: Omit<UserSettings, 'id'> = {
        userId,
        weeklyBudget: DEFAULT_WEEKLY_BUDGET,
        storageMode: DEFAULT_STORAGE_MODE
      };
      const docRef = await addDoc(settingsRef, defaultSettings);
      return { id: docRef.id, ...defaultSettings };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    // Fallback für bestehende User ohne storageMode
    return {
      id: doc.id,
      ...data,
      storageMode: data.storageMode || DEFAULT_STORAGE_MODE
    } as UserSettings;
  } catch (error) {
    return handleFirestoreError(error, 'getUserSettings');
  }
};

export const updateUserSettings = async (settingsId: string, data: Partial<UserSettings>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userSettings', settingsId), data);
  } catch (error) {
    return handleFirestoreError(error, 'updateUserSettings');
  }
};

export const subscribeToUserSettings = (
  userId: string,
  callback: (settings: UserSettings) => void,
  onError?: (error: Error) => void
) => {
  const settingsRef = collection(db, 'userSettings');
  const q = query(settingsRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Erstelle Default-Settings wenn keine vorhanden
        const defaultSettings: Omit<UserSettings, 'id'> = {
          userId,
          weeklyBudget: DEFAULT_WEEKLY_BUDGET,
          storageMode: DEFAULT_STORAGE_MODE
        };
        const docRef = await addDoc(settingsRef, defaultSettings);
        callback({ id: docRef.id, ...defaultSettings });
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        // Fallback für bestehende User ohne storageMode
        callback({
          id: doc.id,
          ...data,
          storageMode: data.storageMode || DEFAULT_STORAGE_MODE
        } as UserSettings);
      }
    },
    (error) => {
      console.error('subscribeToUserSettings Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Einstellungen: ${error.message}`));
    }
  );
};

// Expense Areas (Bereiche für Ausgaben-Kategorisierung)
export const addExpenseArea = async (area: Omit<ExpenseArea, 'id'>): Promise<string> => {
  try {
    const areasRef = collection(db, 'expenseAreas');
    const docRef = await addDoc(areasRef, {
      ...area,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'addExpenseArea');
  }
};

export const getExpenseAreas = async (userId: string): Promise<ExpenseArea[]> => {
  try {
    const areasRef = collection(db, 'expenseAreas');
    const q = query(areasRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as ExpenseArea[];
  } catch (error) {
    return handleFirestoreError(error, 'getExpenseAreas');
  }
};

export const updateExpenseArea = async (areaId: string, data: Partial<ExpenseArea>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'expenseAreas', areaId), data);
  } catch (error) {
    handleFirestoreError(error, 'updateExpenseArea');
  }
};

export const deleteExpenseArea = async (areaId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'expenseAreas', areaId));
  } catch (error) {
    handleFirestoreError(error, 'deleteExpenseArea');
  }
};

export const subscribeToExpenseAreas = (
  userId: string,
  callback: (areas: ExpenseArea[]) => void,
  onError?: (error: Error) => void
) => {
  const areasRef = collection(db, 'expenseAreas');
  const q = query(areasRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const areas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as ExpenseArea[];
      // Nach Priorität sortieren (höchste zuerst)
      areas.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      callback(areas);
    },
    (error) => {
      console.error('subscribeToExpenseAreas Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Bereiche: ${error.message}`));
    }
  );
};

// Real-time listener für ALLE Expenses (für Autocomplete)
export const subscribeToAllExpenses = (
  userId: string,
  callback: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
) => {
  const expensesRef = collection(db, 'expenses');
  const q = query(expensesRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Expense[];
      callback(expenses);
    },
    (error) => {
      console.error('subscribeToAllExpenses Fehler:', error);
      onError?.(new Error(`Fehler beim Laden aller Ausgaben: ${error.message}`));
    }
  );
};

// Alle Expenses eines Jahres abrufen (für Jahresstatistik)
export const getExpensesForYear = async (userId: string, year: number): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const q = query(
      expensesRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Expense[];
  } catch (error) {
    return handleFirestoreError(error, 'getExpensesForYear');
  }
};

// Alle Expenses eines Users abrufen (für Export)
export const getAllExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Expense[];
  } catch (error) {
    return handleFirestoreError(error, 'getAllExpenses');
  }
};

// CSV Export: Ausgaben als CSV-String exportieren
export const exportExpensesToCSV = async (userId: string): Promise<string> => {
  const expenses = await getAllExpenses(userId);

  // CSV Header (Semikolon-getrennt für deutsche Excel-Kompatibilität)
  const header = 'Datum;Betrag;Kategorie;Beschreibung';

  // CSV Zeilen (sortiert nach Datum absteigend)
  const rows = expenses
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(expense => {
      const date = expense.date.toLocaleDateString('de-DE');
      const amount = expense.amount.toFixed(2).replace('.', ',');
      const category = expense.category;
      const description = expense.description.replace(/"/g, '""');
      return `${date};${amount};${category};"${description}"`;
    });

  return [header, ...rows].join('\n');
};

// CSV Import: CSV-String zu Ausgaben parsen und importieren
export const importExpensesFromCSV = async (
  userId: string,
  csvContent: string,
  mode: 'merge' | 'replace'
): Promise<{ imported: number; skipped: number; errors: string[] }> => {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  if (lines.length < 2) {
    throw new Error('CSV-Datei enthält keine Daten');
  }

  // Bei 'replace': Erst alle Ausgaben löschen
  if (mode === 'replace') {
    await deleteAllExpenses(userId);
  }

  // Zeilen parsen (ab Zeile 2)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // CSV-Zeile parsen (Semikolon-getrennt)
      const match = line.match(/^([^;]+);([^;]+);([^;]+);(?:"([^"]*(?:""[^"]*)*)"|([^;]*))$/);
      if (!match) {
        errors.push(`Zeile ${i + 1}: Ungültiges Format`);
        skipped++;
        continue;
      }

      const [, dateStr, amountStr, category, descQuoted, descUnquoted] = match;
      const description = (descQuoted || descUnquoted || '').replace(/""/g, '"');

      // Datum parsen (DD.MM.YYYY)
      const dateParts = dateStr.split('.');
      if (dateParts.length !== 3) {
        errors.push(`Zeile ${i + 1}: Ungültiges Datum`);
        skipped++;
        continue;
      }
      const date = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0])
      );
      if (isNaN(date.getTime())) {
        errors.push(`Zeile ${i + 1}: Ungültiges Datum`);
        skipped++;
        continue;
      }

      // Betrag parsen
      const amount = parseFloat(amountStr.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Zeile ${i + 1}: Ungültiger Betrag`);
        skipped++;
        continue;
      }

      // Kategorie validieren
      const validCategory = category === 'Alltag' || category === 'Sonderposten'
        ? category as 'Alltag' | 'Sonderposten'
        : 'Alltag';

      await addExpense({
        amount,
        category: validCategory,
        description: description.trim(),
        date,
        userId
      });
      imported++;
    } catch {
      errors.push(`Zeile ${i + 1}: Fehler beim Importieren`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
};

// Export: Alle Daten eines Users exportieren
export const exportAllUserData = async (userId: string): Promise<ExportData> => {
  try {
    const [expenses, fixedCosts, incomes, areas, filters] = await Promise.all([
      getAllExpenses(userId),
      getFixedCosts(userId),
      getIncomes(userId),
      getExpenseAreas(userId),
      getKeywordFilters(userId)
    ]);

    // IDs und userId entfernen für Export
    const cleanExpenses = expenses.map(({ id, userId: _, ...rest }) => ({
      ...rest,
      date: rest.date // Date bleibt als Date
    }));
    const cleanFixedCosts = fixedCosts.map(({ id, userId: _, ...rest }) => rest);
    const cleanIncomes = incomes.map(({ id, userId: _, ...rest }) => rest);
    const cleanAreas = areas.map(({ id, userId: _, ...rest }) => rest);
    const cleanFilters = filters.map(({ id, userId: _, ...rest }) => rest);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      expenses: cleanExpenses as Omit<Expense, 'id'>[],
      fixedCosts: cleanFixedCosts as Omit<FixedCost, 'id'>[],
      incomes: cleanIncomes as Omit<Income, 'id'>[],
      expenseAreas: cleanAreas as Omit<ExpenseArea, 'id'>[],
      keywordFilters: cleanFilters as Omit<KeywordFilter, 'id'>[]
    };
  } catch (error) {
    return handleFirestoreError(error, 'exportAllUserData');
  }
};

// Hilfsfunktion: Alle Daten einer Collection löschen
const deleteAllUserDataFromCollection = async (collectionName: string, userId: string): Promise<void> => {
  const collRef = collection(db, collectionName);
  const q = query(collRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

// Import: Daten eines Users importieren
export const importUserData = async (
  userId: string,
  data: ExportData,
  mode: 'merge' | 'replace'
): Promise<{ imported: number; skipped: number }> => {
  try {
    let imported = 0;

    // Bei 'replace': Erst alle bestehenden Daten löschen
    if (mode === 'replace') {
      await Promise.all([
        deleteAllUserDataFromCollection('expenses', userId),
        deleteAllUserDataFromCollection('fixedCosts', userId),
        deleteAllUserDataFromCollection('incomes', userId),
        deleteAllUserDataFromCollection('expenseAreas', userId),
        deleteAllUserDataFromCollection('keywordFilters', userId)
      ]);
    }

    // Expenses importieren
    for (const expense of data.expenses) {
      const expenseData: Omit<Expense, 'id'> = {
        ...expense,
        userId,
        date: new Date(expense.date) // String zu Date konvertieren
      };
      await addExpense(expenseData);
      imported++;
    }

    // FixedCosts importieren
    for (const fixedCost of data.fixedCosts) {
      await addFixedCost({ ...fixedCost, userId });
      imported++;
    }

    // Incomes importieren
    for (const income of data.incomes) {
      await addIncome({ ...income, userId });
      imported++;
    }

    // ExpenseAreas importieren
    for (const area of data.expenseAreas) {
      await addExpenseArea({ ...area, userId });
      imported++;
    }

    // KeywordFilters importieren
    for (const filter of data.keywordFilters) {
      await addKeywordFilter({ ...filter, userId });
      imported++;
    }

    return { imported, skipped: 0 };
  } catch (error) {
    return handleFirestoreError(error, 'importUserData');
  }
};
