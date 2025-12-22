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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, FixedCost, Income } from '../types';

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  const expensesRef = collection(db, 'expenses');
  const docRef = await addDoc(expensesRef, {
    ...expense,
    date: Timestamp.fromDate(expense.date)
  });
  return docRef.id;
};

export const getExpenses = async (userId: string, month: number, year: number) => {
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

  // Sortierung im Client statt in Firestore (kein Index nötig)
  return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const deleteExpense = async (expenseId: string) => {
  await deleteDoc(doc(db, 'expenses', expenseId));
};

export const updateExpense = async (expenseId: string, data: Partial<Expense>) => {
  await updateDoc(doc(db, 'expenses', expenseId), data);
};

export const deleteAllExpenses = async (userId: string) => {
  const expensesRef = collection(db, 'expenses');
  const q = query(expensesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

export const deleteExpensesForMonth = async (userId: string, month: number, year: number) => {
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
};

// Fixed Costs
export const addFixedCost = async (fixedCost: Omit<FixedCost, 'id'>) => {
  const fixedCostsRef = collection(db, 'fixedCosts');
  const docRef = await addDoc(fixedCostsRef, fixedCost);
  return docRef.id;
};

export const getFixedCosts = async (userId: string) => {
  const fixedCostsRef = collection(db, 'fixedCosts');
  const q = query(fixedCostsRef, where('userId', '==', userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FixedCost[];
};

export const updateFixedCost = async (fixedCostId: string, data: Partial<FixedCost>) => {
  await updateDoc(doc(db, 'fixedCosts', fixedCostId), data);
};

export const deleteFixedCost = async (fixedCostId: string) => {
  await deleteDoc(doc(db, 'fixedCosts', fixedCostId));
};

// Incomes
export const addIncome = async (income: Omit<Income, 'id'>) => {
  const incomesRef = collection(db, 'incomes');
  const docRef = await addDoc(incomesRef, income);
  return docRef.id;
};

export const getIncomes = async (userId: string) => {
  const incomesRef = collection(db, 'incomes');
  const q = query(incomesRef, where('userId', '==', userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Income[];
};

export const updateIncome = async (incomeId: string, data: Partial<Income>) => {
  await updateDoc(doc(db, 'incomes', incomeId), data);
};

export const deleteIncome = async (incomeId: string) => {
  await deleteDoc(doc(db, 'incomes', incomeId));
};

// Real-time listeners
export const subscribeToExpenses = (
  userId: string,
  month: number,
  year: number,
  callback: (expenses: Expense[]) => void
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

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Expense[];

    // Sortierung im Client
    const sortedExpenses = expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
    callback(sortedExpenses);
  });
};

export const subscribeToFixedCosts = (
  userId: string,
  callback: (fixedCosts: FixedCost[]) => void
) => {
  const fixedCostsRef = collection(db, 'fixedCosts');
  const q = query(fixedCostsRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const fixedCosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FixedCost[];
    callback(fixedCosts);
  });
};

export const subscribeToIncomes = (
  userId: string,
  callback: (incomes: Income[]) => void
) => {
  const incomesRef = collection(db, 'incomes');
  const q = query(incomesRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const incomes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Income[];
    callback(incomes);
  });
};
