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
  recurrence?: RecurrenceType; // Wiederholungsintervall (default: 'monthly' für Rückwärtskompatibilität)
  recurrenceMonths?: number[]; // Für quarterly/yearly: Monate (1-12) in denen die Kosten anfallen
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

export interface KeywordFilter {
  id: string;
  keyword: string;
  userId: string;
  createdAt?: Date;
}

export type StorageMode = 'cloud' | 'local';

// Wiederholungsintervall für Fixkosten
export type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'once';

export interface UserSettings {
  id: string;
  userId: string;
  weeklyBudget: number; // Wochenlimit in Euro (default: 200)
  storageMode: StorageMode; // 'cloud' = Firebase, 'local' = nur lokal (IndexedDB)
}

// Bereiche für Ausgaben-Kategorisierung
export interface ExpenseArea {
  id: string;
  name: string;           // z.B. "Lebensmittel"
  keywords: string[];     // z.B. ["REWE", "Bäcker", "Edeka", "Lidl"]
  color: string;          // Hex-Farbcode für Visualisierung
  priority: number;       // Für Konfliktlösung bei Mehrfach-Match (höher = wichtiger)
  userId: string;
  createdAt?: Date;
}

// Statistik pro Bereich
export interface AreaStatistics {
  areaId: string;
  areaName: string;
  color: string;
  totalAmount: number;
  expenseCount: number;
  expenses: Expense[];
  fixedCosts: FixedCost[];
}

// Monatliche Bereichsstatistik
export interface MonthlyAreaStats {
  yearMonth: number;
  areas: AreaStatistics[];
  unassigned: {
    totalAmount: number;
    expenseCount: number;
    expenses: Expense[];
  };
}

// Jahresstatistik pro Bereich
export interface YearlyAreaStats {
  year: number;
  areas: {
    areaId: string;
    areaName: string;
    color: string;
    monthlyTotals: { month: number; amount: number }[];
    yearTotal: number;
  }[];
  unassignedTotal: number;
}
