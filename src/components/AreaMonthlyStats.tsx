import React, { useMemo } from 'react';
import { Expense, ExpenseArea } from '../types';
import { calculateMonthlyAreaStats } from '../utils/areaMatching';
import { formatCurrency } from '../utils/dateUtils';

interface AreaMonthlyStatsProps {
  expenses: Expense[];
  areas: ExpenseArea[];
  yearMonth: number;
}

const AreaMonthlyStats: React.FC<AreaMonthlyStatsProps> = ({
  expenses,
  areas,
  yearMonth
}) => {
  const stats = useMemo(
    () => calculateMonthlyAreaStats(expenses, areas, yearMonth),
    [expenses, areas, yearMonth]
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

            return (
              <div key={area.areaId}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="font-medium">{area.areaName}</span>
                    <span className="text-white/40 text-sm">
                      ({area.expenseCount} Ausgaben)
                    </span>
                  </div>
                  <span className="font-bold" style={{ color: area.color }}>
                    {formatCurrency(area.totalAmount)}
                  </span>
                </div>
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
