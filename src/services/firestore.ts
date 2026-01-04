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
import { Expense, FixedCost, Income, KeywordFilter, UserSettings } from '../types';

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

export const copyFixedCostsFromPreviousMonth = async (
  userId: string,
  fromYearMonth: number,
  toYearMonth: number
): Promise<number> => {
  try {
    const sourceCosts = await getFixedCostsForMonth(userId, fromYearMonth);

    const copyPromises = sourceCosts.map(async (cost) => {
      const newCost: Omit<FixedCost, 'id'> = {
        name: cost.name,
        amount: cost.amount,
        yearMonth: toYearMonth,
        userId: userId,
      };
      return addFixedCost(newCost);
    });

    await Promise.all(copyPromises);
    return sourceCosts.length;
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

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const settingsRef = collection(db, 'userSettings');
    const q = query(settingsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Erstelle Default-Settings
      const defaultSettings: Omit<UserSettings, 'id'> = {
        userId,
        weeklyBudget: DEFAULT_WEEKLY_BUDGET
      };
      const docRef = await addDoc(settingsRef, defaultSettings);
      return { id: docRef.id, ...defaultSettings };
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserSettings;
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
          weeklyBudget: DEFAULT_WEEKLY_BUDGET
        };
        const docRef = await addDoc(settingsRef, defaultSettings);
        callback({ id: docRef.id, ...defaultSettings });
      } else {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() } as UserSettings);
      }
    },
    (error) => {
      console.error('subscribeToUserSettings Fehler:', error);
      onError?.(new Error(`Fehler beim Laden der Einstellungen: ${error.message}`));
    }
  );
};
