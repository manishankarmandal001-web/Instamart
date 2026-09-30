import React from 'react';
import { SalesRecord } from '../data/initialData';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Calendar, TrendingUp } from 'lucide-react';

interface DayOfWeekChartProps {
  records: SalesRecord[];
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
        No sales data available for day-of-week pattern analysis.
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const stats = days.map((day) => {
    const dayRecords = records.filter((r) => r.dayOfWeek === day);
    const gmv = dayRecords.reduce((s, r) => s + r.gmv, 0);
    const orders = dayRecords.reduce((s, r) => s + r.orders, 0);
    const impressions = dayRecords.reduce((s, r) => s + r.impressions, 0);
    const zeroCount = dayRecords.filter((r) => r.salesTier === 'zero').length;
    return {
      day,
      gmv,
      orders,
      impressions,
      zeroCount,
      count: dayRecords.length,
    };
  });

  const maxGmv = Math.max(...stats.map((s) => s.gmv), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Day-of-Week Sales Velocity Pattern</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identify peak conversion days vs low-performance days of the week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {stats.map((item) => {
          const heightPercent = (item.gmv / maxGmv) * 100;
          const isBest = item.gmv === maxGmv;

          return (
            <div
              key={item.day}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isBest
                  ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 dark:text-slate-200">{item.day.slice(0, 3)}</span>
                  {isBest && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-600 text-white font-bold">
                      PEAK
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(item.gmv)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {item.orders} orders
                </div>
              </div>

              {/* Mini vertical bar indicator */}
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${isBest ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-500'}`}
                    style={{ width: `${Math.max(heightPercent, 5)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                  {item.zeroCount} zero-sales
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
