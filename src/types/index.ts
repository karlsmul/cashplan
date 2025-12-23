export type ExpenseCategory = 'Alltag' | 'Sonderposten';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  userId: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  yearMonth: number; // YYYYMM - Jede Fixkosten gehört zu genau einem Monat (z.B. 202601 für Januar 2026)
  paidMonths?: number[]; // Monate, in denen die Kosten bereits bezahlt wurden (Format: YYYYMM als number, z.B. 202412)
  userId: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  yearMonth: number; // YYYYMM - Jede Einnahme gehört zu genau einem Monat (z.B. 202601 für Januar 2026)
  userId: string;
}

export interface MonthlyData {
  month: number;
  year: number;
  fixedCosts: FixedCost[];
  incomes: Income[];
  expenses: Expense[];
  userId: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  expenses: Expense[];
  total: number;
}

export interface MonthBalance {
  totalIncome: number;
  totalFixedCosts: number;
  totalExpenses: number;
  balance: number;
  trend: number; // Prognose basierend auf bisherigen Ausgaben
}

export interface YearBalance {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyBalances: MonthBalance[];
}
