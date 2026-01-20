import React, { useMemo, useState } from 'react';
import { Expense, ExpenseArea, FixedCost } from '../types';
import { calculateMonthlyAreaStats } from '../utils/areaMatching';
import { formatCurrency } from '../utils/dateUtils';

interface AreaMonthlyStatsProps {
  expenses: Expense[];
  areas: ExpenseArea[];
  yearMonth: number;
  fixedCosts?: FixedCost[];
}

const AreaMonthlyStats: React.FC<AreaMonthlyStatsProps> = ({
  expenses,
  areas,
  yearMonth,
  fixedCosts = []
}) => {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const stats = useMemo(
    () => calculateMonthlyAreaStats(expenses, areas, yearMonth, fixedCosts),
    [expenses, areas, yearMonth, fixedCosts]
  );

  // Gesamtsumme aller zugeordneten Ausgaben
  const totalAssigned = stats.areas.reduce((sum, a) => sum + a.totalAmount, 0);
  const grandTotal = totalAssigned + stats.unassigned.totalAmount;

  if (areas.length === 0) {
    return null; // Zeige nichts wenn keine Bereiche definiert sind
  }

  return (
    <div className="card mb-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
      <h3 className="text-xl font-bold mb-4 text-teal-300">
        Ausgaben nach Bereichen
      </h3>

      {stats.areas.length === 0 && stats.unassigned.expenseCount === 0 ? (
        <p className="text-white/60">Keine Ausgaben in diesem Monat</p>
      ) : (
        <div className="space-y-3">
          {stats.areas.map(area => {
            const percentage = grandTotal > 0 ? (area.totalAmount / grandTotal) * 100 : 0;
            const isExpanded = expandedArea === area.areaId;
            const hasDetails = area.expenses.length > 0 || area.fixedCosts.length > 0;

            return (
              <div key={area.areaId}>
                <div
                  className={`flex justify-between items-center mb-1 ${hasDetails ? 'cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
                  onClick={() => hasDetails && setExpandedArea(isExpanded ? null : area.areaId)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="font-medium">{area.areaName}</span>
                    <span className="text-white/40 text-sm">
                      ({area.expenseCount} Posten)
                    </span>
                    {hasDetails && (
                      <span className="text-white/30 text-xs">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <span className="font-bold" style={{ color: area.color }}>
                    {formatCurrency(area.totalAmount)}
                  </span>
                </div>

                {/* Aufgeklappte Details */}
                {isExpanded && (
                  <div className="ml-5 mb-3 space-y-1 text-sm">
                    {area.fixedCosts.map(fc => (
                      <div key={fc.id} className="flex justify-between text-white/70 bg-white/5 rounded px-2 py-1">
                        <span className="flex items-center gap-1">
                          <span className="text-xs text-purple-400">Fix</span>
                          {fc.name}
                        </span>
                        <span>{formatCurrency(fc.amount)}</span>
                      </div>
                    ))}
                    {area.expenses.map(expense => (
                      <div key={expense.id} className="flex justify-between text-white/70 bg-white/5 rounded px-2 py-1">
                        <span>{expense.description}</span>
                        <span>{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fortschrittsbalken */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: area.color
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Nicht zugeordnete Ausgaben */}
          {stats.unassigned.expenseCount > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <span className="font-medium text-white/60">Nicht zugeordnet</span>
                  <span className="text-white/40 text-sm">
                    ({stats.unassigned.expenseCount} Ausgaben)
                  </span>
                </div>
                <span className="font-bold text-white/60">
                  {formatCurrency(stats.unassigned.totalAmount)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/30"
                  style={{
                    width: `${grandTotal > 0 ? (stats.unassigned.totalAmount / grandTotal) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Gesamtsumme */}
          <div className="pt-3 mt-3 border-t border-white/20">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white/80">Gesamt</span>
              <span className="font-bold text-teal-400 text-lg">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaMonthlyStats;
