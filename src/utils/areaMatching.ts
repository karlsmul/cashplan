import { Expense, ExpenseArea, AreaStatistics, MonthlyAreaStats, YearlyAreaStats, FixedCost } from '../types';

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
 * Ordnet eine Fixkosten einem Bereich zu basierend auf Keyword-Matching
 */
export const matchFixedCostToArea = (
  fixedCost: FixedCost,
  areas: ExpenseArea[]
): ExpenseArea | null => {
  const nameNormalized = normalizeForMatching(fixedCost.name);

  const matchingAreas = areas.filter(area =>
    area.keywords.some(keyword =>
      nameNormalized.includes(normalizeForMatching(keyword))
    )
  );

  if (matchingAreas.length === 0) {
    return null;
  }

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
      expenses: areaExpenses,
      fixedCosts: []
    };
  });
};

/**
 * Berechnet monatliche Bereichsstatistiken (inkl. Fixkosten)
 */
export const calculateMonthlyAreaStats = (
  expenses: Expense[],
  areas: ExpenseArea[],
  yearMonth: number,
  fixedCosts: FixedCost[] = []
): MonthlyAreaStats => {
  const { byArea, unassigned } = groupExpensesByArea(expenses, areas);

  // Fixkosten den Bereichen zuordnen
  const fixedCostsByArea = new Map<string, FixedCost[]>();
  areas.forEach(area => fixedCostsByArea.set(area.id, []));

  const unassignedFixedCosts: FixedCost[] = [];
  fixedCosts.forEach(fc => {
    const matchedArea = matchFixedCostToArea(fc, areas);
    if (matchedArea) {
      fixedCostsByArea.get(matchedArea.id)?.push(fc);
    } else {
      unassignedFixedCosts.push(fc);
    }
  });

  const areaStats: AreaStatistics[] = areas.map(area => {
    const areaExpenses = byArea.get(area.id) || [];
    const areaFixedCosts = fixedCostsByArea.get(area.id) || [];
    const fixedCostAmount = areaFixedCosts.reduce((sum, fc) => sum + fc.amount, 0);
    return {
      areaId: area.id,
      areaName: area.name,
      color: area.color,
      totalAmount: areaExpenses.reduce((sum, e) => sum + e.amount, 0) + fixedCostAmount,
      expenseCount: areaExpenses.length + areaFixedCosts.length,
      expenses: areaExpenses,
      fixedCosts: areaFixedCosts
    };
  });

  const unassignedFixedCostAmount = unassignedFixedCosts.reduce((sum, fc) => sum + fc.amount, 0);

  return {
    yearMonth,
    areas: areaStats, // Alle Bereiche anzeigen, auch mit 0€
    unassigned: {
      totalAmount: unassigned.reduce((sum, e) => sum + e.amount, 0) + unassignedFixedCostAmount,
      expenseCount: unassigned.length + unassignedFixedCosts.length,
      expenses: unassigned
    }
  };
};

/**
 * Berechnet Jahresstatistik: Summen pro Bereich pro Monat (inkl. Fixkosten)
 */
export const calculateYearlyAreaStats = (
  expenses: Expense[],
  areas: ExpenseArea[],
  year: number,
  fixedCosts: FixedCost[] = []
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

  // Gruppiere Fixkosten nach Monat
  const fixedCostsByMonth = new Map<number, FixedCost[]>();
  for (let month = 1; month <= 12; month++) {
    fixedCostsByMonth.set(month, []);
  }

  fixedCosts.forEach(fc => {
    const month = fc.yearMonth % 100; // YYYYMM -> MM
    if (month >= 1 && month <= 12) {
      fixedCostsByMonth.get(month)?.push(fc);
    }
  });

  // Berechne Statistiken pro Bereich
  const areaStats = areas.map(area => {
    const monthlyTotals: { month: number; amount: number }[] = [];
    let yearTotal = 0;

    for (let month = 1; month <= 12; month++) {
      // Variable Ausgaben
      const monthExpenses = expensesByMonth.get(month) || [];
      const areaExpenses = monthExpenses.filter(e => {
        const matched = matchExpenseToArea(e, areas);
        return matched?.id === area.id;
      });
      let monthAmount = areaExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Fixkosten hinzufügen
      const monthFixedCosts = fixedCostsByMonth.get(month) || [];
      monthFixedCosts.forEach(fc => {
        const matched = matchFixedCostToArea(fc, areas);
        if (matched?.id === area.id) {
          monthAmount += fc.amount;
        }
      });

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
  let unassignedTotal = unassigned.reduce((sum, e) => sum + e.amount, 0);

  // Nicht zugeordnete Fixkosten
  fixedCosts.forEach(fc => {
    if (!matchFixedCostToArea(fc, areas)) {
      unassignedTotal += fc.amount;
    }
  });

  return {
    year,
    areas: areaStats, // Alle Bereiche anzeigen, auch mit 0€
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
