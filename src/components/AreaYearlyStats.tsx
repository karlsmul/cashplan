import React, { useMemo } from 'react';
import { Expense, ExpenseArea, FixedCost } from '../types';
import { calculateYearlyAreaStats } from '../utils/areaMatching';
import { formatCurrency } from '../utils/dateUtils';

interface AreaYearlyStatsProps {
  expenses: Expense[];
  areas: ExpenseArea[];
  year: number;
  fixedCosts?: FixedCost[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const AreaYearlyStats: React.FC<AreaYearlyStatsProps> = ({
  expenses,
  areas,
  year,
  fixedCosts = []
}) => {
  const stats = useMemo(
    () => calculateYearlyAreaStats(expenses, areas, year, fixedCosts),
    [expenses, areas, year, fixedCosts]
  );

  if (areas.length === 0 || stats.areas.length === 0) {
    return null;
  }

  // Berechne Monatssummen
  const monthlyTotals = MONTH_NAMES.map((_, index) => {
    return stats.areas.reduce((sum, area) => {
      const monthData = area.monthlyTotals.find(m => m.month === index + 1);
      return sum + (monthData?.amount || 0);
    }, 0);
  });

  const grandTotal = stats.areas.reduce((sum, a) => sum + a.yearTotal, 0);

  return (
    <div className="card mb-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
      <h3 className="text-xl font-bold mb-4 text-teal-300">
        Jahresübersicht nach Bereichen {year}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-2 pr-4 font-medium text-white/80">Bereich</th>
              {MONTH_NAMES.map(month => (
                <th key={month} className="text-right py-2 px-1 font-medium text-white/60 min-w-[60px]">
                  {month}
                </th>
              ))}
              <th className="text-right py-2 pl-4 font-bold text-white/80">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {stats.areas.map(area => (
              <tr key={area.areaId} className="border-b border-white/10">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: area.color }}
                    />
                    <span style={{ color: area.color }}>{area.areaName}</span>
                  </div>
                </td>
                {area.monthlyTotals.map(monthData => (
                  <td
                    key={monthData.month}
                    className="text-right py-2 px-1 text-white/70"
                  >
                    {monthData.amount > 0 ? formatCurrency(monthData.amount) : '-'}
                  </td>
                ))}
                <td
                  className="text-right py-2 pl-4 font-bold"
                  style={{ color: area.color }}
                >
                  {formatCurrency(area.yearTotal)}
                </td>
              </tr>
            ))}

            {/* Monatssummen */}
            <tr className="border-t-2 border-white/30">
              <td className="py-2 pr-4 font-bold text-white/80">Summe</td>
              {monthlyTotals.map((total, index) => (
                <td
                  key={index}
                  className="text-right py-2 px-1 font-medium text-teal-400"
                >
                  {total > 0 ? formatCurrency(total) : '-'}
                </td>
              ))}
              <td className="text-right py-2 pl-4 font-bold text-teal-400 text-lg">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nicht zugeordnete Ausgaben Hinweis */}
      {stats.unassignedTotal > 0 && (
        <p className="mt-4 text-sm text-white/50">
          Nicht zugeordnet: {formatCurrency(stats.unassignedTotal)}
        </p>
      )}
    </div>
  );
};

export default AreaYearlyStats;
