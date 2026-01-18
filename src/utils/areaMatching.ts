import { Expense, ExpenseArea, AreaStatistics, MonthlyAreaStats, YearlyAreaStats } from '../types';

/**
 * Normalisiert einen String für Fuzzy-Matching:
 * - Kleinschreibung
 * - Entfernt Akzente (é → e, ä → a, etc.)
 */
export const normalizeForMatching = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Entfernt diakritische Zeichen
};

/**
 * Ordnet eine Ausgabe einem Bereich zu basierend auf Keyword-Matching
 *
 * Matching-Regeln:
 * 1. Case-insensitive Suche
 * 2. Akzent-insensitive Suche (Café = Cafe = café)
 * 3. Teilstring-Match (z.B. "REWE" matched "REWE City Berlin")
 * 4. Bei mehreren Matches: Bereich mit höchster Priorität gewinnt
 * 5. Kein Match: Gibt null zurück
 */
export const matchExpenseToArea = (
  expense: Expense,
  areas: ExpenseArea[]
): ExpenseArea | null => {
  const descriptionNormalized = normalizeForMatching(expense.description);

  // Finde alle passenden Bereiche
  const matchingAreas = areas.filter(area =>
    area.keywords.some(keyword =>
      descriptionNormalized.includes(normalizeForMatching(keyword))
    )
  );

  if (matchingAreas.length === 0) {
    return null;
  }

  // Bei mehreren Matches: Höchste Priorität gewinnt
  return matchingAreas.reduce((highest, current) =>
    (current.priority || 0) > (highest.priority || 0) ? current : highest
  );
};

/**
 * Gruppiert Ausgaben nach Bereichen
 */
export const groupExpensesByArea = (
  expenses: Expense[],
  areas: ExpenseArea[]
): {
  byArea: Map<string, Expense[]>;
  unassigned: Expense[]
} => {
  const byArea = new Map<string, Expense[]>();
  const unassigned: Expense[] = [];

  // Initialisiere Map für jeden Bereich
  areas.forEach(area => byArea.set(area.id, []));

  // Ordne jede Ausgabe zu
  expenses.forEach(expense => {
    const matchedArea = matchExpenseToArea(expense, areas);
    if (matchedArea) {
      byArea.get(matchedArea.id)!.push(expense);
    } else {
      unassigned.push(expense);
    }
  });

  return { byArea, unassigned };
};

/**
 * Berechnet Statistiken pro Bereich für einen Monat
 */
export const calculateAreaStatistics = (
  expenses: Expense[],
  areas: ExpenseArea[]
): AreaStatistics[] => {
  const { byArea } = groupExpensesByArea(expenses, areas);

  return areas.map(area => {
    const areaExpenses = byArea.get(area.id) || [];
    return {
      areaId: area.id,
      areaName: area.name,
      color: area.color,
      totalAmount: areaExpenses.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: areaExpenses.length,
      expenses: areaExpenses
    };
  });
};

/**
 * Berechnet monatliche Bereichsstatistiken
 */
export const calculateMonthlyAreaStats = (
  expenses: Expense[],
  areas: ExpenseArea[],
  yearMonth: number
): MonthlyAreaStats => {
  const { byArea, unassigned } = groupExpensesByArea(expenses, areas);

  const areaStats: AreaStatistics[] = areas.map(area => {
    const areaExpenses = byArea.get(area.id) || [];
    return {
      areaId: area.id,
      areaName: area.name,
      color: area.color,
      totalAmount: areaExpenses.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: areaExpenses.length,
      expenses: areaExpenses
    };
  });

  return {
    yearMonth,
    areas: areaStats.filter(a => a.expenseCount > 0), // Nur Bereiche mit Ausgaben
    unassigned: {
      totalAmount: unassigned.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: unassigned.length,
      expenses: unassigned
    }
  };
};

/**
 * Berechnet Jahresstatistik: Summen pro Bereich pro Monat
 */
export const calculateYearlyAreaStats = (
  expenses: Expense[],
  areas: ExpenseArea[],
  year: number
): YearlyAreaStats => {
  // Gruppiere Expenses nach Monat
  const expensesByMonth = new Map<number, Expense[]>();
  for (let month = 1; month <= 12; month++) {
    expensesByMonth.set(month, []);
  }

  expenses.forEach(expense => {
    const month = expense.date.getMonth() + 1;
    expensesByMonth.get(month)?.push(expense);
  });

  // Berechne Statistiken pro Bereich
  const areaStats = areas.map(area => {
    const monthlyTotals: { month: number; amount: number }[] = [];
    let yearTotal = 0;

    for (let month = 1; month <= 12; month++) {
      const monthExpenses = expensesByMonth.get(month) || [];
      const areaExpenses = monthExpenses.filter(e => {
        const matched = matchExpenseToArea(e, areas);
        return matched?.id === area.id;
      });
      const monthAmount = areaExpenses.reduce((sum, e) => sum + e.amount, 0);
      monthlyTotals.push({ month, amount: monthAmount });
      yearTotal += monthAmount;
    }

    return {
      areaId: area.id,
      areaName: area.name,
      color: area.color,
      monthlyTotals,
      yearTotal
    };
  });

  // Berechne nicht zugeordnete Ausgaben
  const { unassigned } = groupExpensesByArea(expenses, areas);
  const unassignedTotal = unassigned.reduce((sum, e) => sum + e.amount, 0);

  return {
    year,
    areas: areaStats.filter(a => a.yearTotal > 0),
    unassignedTotal
  };
};

// Vordefinierte Farben für Bereiche
export const AREA_COLORS = [
  '#22c55e', // Grün
  '#3b82f6', // Blau
  '#a855f7', // Lila
  '#ec4899', // Rosa
  '#f97316', // Orange
  '#14b8a6', // Türkis
  '#eab308', // Gelb
  '#ef4444', // Rot
];
