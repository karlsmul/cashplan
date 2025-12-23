import { getFixedCosts, getIncomes, addFixedCost, addIncome, deleteFixedCost, deleteIncome } from '../services/firestore';

/**
 * Migriert alte Fixkosten und Einnahmen zum neuen yearMonth-Format
 *
 * Alte Formate:
 * - months: [1,2,3] → Wiederkehrende Monate
 * - specificMonths: [202601, 202602] → Spezifische Monate
 *
 * Neues Format:
 * - yearMonth: 202601 → Genau ein Monat
 */

export const migrateLegacyData = async (userId: string) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  console.log('🔄 Starte Migration...');

  // 1. Lade alle Fixkosten
  const fixedCosts = await getFixedCosts(userId);
  const incomes = await getIncomes(userId);

  let migratedCosts = 0;
  let migratedIncomes = 0;

  // 2. Migriere Fixkosten
  for (const cost of fixedCosts) {
    // Überspringe wenn bereits migriert
    if (cost.yearMonth) {
      console.log(`✓ Fixkosten "${cost.name}" bereits migriert`);
      continue;
    }

    // Fall 1: specificMonths vorhanden - direkt konvertieren
    if ((cost as any).specificMonths && (cost as any).specificMonths.length > 0) {
      for (const ym of (cost as any).specificMonths) {
        await addFixedCost({
          name: cost.name,
          amount: cost.amount,
          yearMonth: ym,
          userId: userId,
          paidMonths: cost.paidMonths
        });
        migratedCosts++;
      }
      // Lösche alten Eintrag
      await deleteFixedCost(cost.id);
      console.log(`✓ Migriert: "${cost.name}" (${(cost as any).specificMonths.length} spezifische Monate)`);
    }
    // Fall 2: months vorhanden - erstelle für nächste 12 Monate
    else if ((cost as any).months && (cost as any).months.length > 0) {
      const months = (cost as any).months as number[]; // 1-12

      // Erstelle Einträge für die nächsten 12 Monate, die in der months-Liste sind
      for (let i = 0; i < 12; i++) {
        const targetMonth = (currentMonth + i) % 12;
        const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
        const monthNumber = targetMonth + 1; // 1-12

        if (months.includes(monthNumber)) {
          const yearMonth = targetYear * 100 + monthNumber;
          await addFixedCost({
            name: cost.name,
            amount: cost.amount,
            yearMonth: yearMonth,
            userId: userId,
            paidMonths: cost.paidMonths
          });
          migratedCosts++;
        }
      }
      // Lösche alten Eintrag
      await deleteFixedCost(cost.id);
      console.log(`✓ Migriert: "${cost.name}" (${months.length} wiederkehrende Monate → 12 Monate)`);
    }
    // Fall 3: Keine Monate angegeben - erstelle für nächste 12 Monate
    else {
      for (let i = 0; i < 12; i++) {
        const targetMonth = (currentMonth + i) % 12;
        const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
        const yearMonth = targetYear * 100 + (targetMonth + 1);

        await addFixedCost({
          name: cost.name,
          amount: cost.amount,
          yearMonth: yearMonth,
          userId: userId,
          paidMonths: cost.paidMonths
        });
        migratedCosts++;
      }
      // Lösche alten Eintrag
      await deleteFixedCost(cost.id);
      console.log(`✓ Migriert: "${cost.name}" (alle Monate → 12 Monate)`);
    }
  }

  // 3. Migriere Einnahmen (gleiche Logik)
  for (const income of incomes) {
    if (income.yearMonth) {
      console.log(`✓ Einnahme "${income.name}" bereits migriert`);
      continue;
    }

    if ((income as any).specificMonths && (income as any).specificMonths.length > 0) {
      for (const ym of (income as any).specificMonths) {
        await addIncome({
          name: income.name,
          amount: income.amount,
          yearMonth: ym,
          userId: userId
        });
        migratedIncomes++;
      }
      await deleteIncome(income.id);
      console.log(`✓ Migriert: "${income.name}" (${(income as any).specificMonths.length} spezifische Monate)`);
    }
    else if ((income as any).months && (income as any).months.length > 0) {
      const months = (income as any).months as number[];

      for (let i = 0; i < 12; i++) {
        const targetMonth = (currentMonth + i) % 12;
        const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
        const monthNumber = targetMonth + 1;

        if (months.includes(monthNumber)) {
          const yearMonth = targetYear * 100 + monthNumber;
          await addIncome({
            name: income.name,
            amount: income.amount,
            yearMonth: yearMonth,
            userId: userId
          });
          migratedIncomes++;
        }
      }
      await deleteIncome(income.id);
      console.log(`✓ Migriert: "${income.name}" (${months.length} wiederkehrende Monate → 12 Monate)`);
    }
    else {
      for (let i = 0; i < 12; i++) {
        const targetMonth = (currentMonth + i) % 12;
        const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
        const yearMonth = targetYear * 100 + (targetMonth + 1);

        await addIncome({
          name: income.name,
          amount: income.amount,
          yearMonth: yearMonth,
          userId: userId
        });
        migratedIncomes++;
      }
      await deleteIncome(income.id);
      console.log(`✓ Migriert: "${income.name}" (alle Monate → 12 Monate)`);
    }
  }

  console.log(`\n✅ Migration abgeschlossen:`);
  console.log(`   ${migratedCosts} Fixkosten-Einträge erstellt`);
  console.log(`   ${migratedIncomes} Einnahmen-Einträge erstellt`);

  return {
    migratedCosts,
    migratedIncomes
  };
};
