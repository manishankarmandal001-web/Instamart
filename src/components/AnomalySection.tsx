import React, { useState } from 'react';
import { SalesRecord } from '../data/initialData';
import { formatCurrency, formatNumber, formatDateWithDay } from '../utils/formatters';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { PerformanceFilter } from '../types';

interface AnomalySectionProps {
  records: SalesRecord[];
  onApplyFilter: (tier: PerformanceFilter) => void;
  onOpenNotesWithTarget?: (date: string, city: string) => void;
}

export const AnomalySection: React.FC<AnomalySectionProps> = ({
  records,
  onApplyFilter,
  onOpenNotesWithTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'zero' | 'low' | 'high' | 'leaks'>('zero');

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
        No sales data available to analyze for anomalies.
      </div>
    );
  }

  const zeroRecords = records.filter((r) => r.salesTier === 'zero');
  const lowRecords = records.filter((r) => r.salesTier === 'low');
  const highRecords = records.filter((r) => r.salesTier === 'high');
  const leakRecords = records.filter((r) => r.isTrafficLeak);

  // Calculate wasted impressions in zero sales
  const wastedImpressions = zeroRecords.reduce((s, r) => s + r.impressions, 0);

  // Group zero sales by city
  const zeroByCity: { [city: string]: { count: number; impressions: number } } = {};
  zeroRecords.forEach((r) => {
    if (!zeroByCity[r.city]) {
      zeroByCity[r.city] = { count: 0, impressions: 0 };
    }
    zeroByCity[r.city].count += 1;
    zeroByCity[r.city].impressions += r.impressions;
  });

  const topZeroCities = Object.entries(zeroByCity)
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  // Group high spikes by date
  const spikeDates = highRecords.sort((a, b) => b.gmv - a.gmv).slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Sales Anomaly & Performance Filter Intelligence</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identify days & cities with zero sales, low conversions, traffic leaks, and high revenue spikes
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('zero')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'zero'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Zero Sales ({zeroRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('leaks')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'leaks'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Traffic Leaks ({leakRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'low'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Low Sales ({lowRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('high')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'high'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            High Spikes ({highRecords.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Zero Sales Anomaly (Point 4) */}
      {activeTab === 'zero' && (
        <div>
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>Zero Sales Detection: {zeroRecords.length} City-Days Generated ₹0 Revenue</span>
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  On these dates, brand impressions and ad spends were delivered in the respective cities, but no orders were converted.
                  Total of <strong>{formatNumber(wastedImpressions)} impressions</strong> had zero order yield.
                </p>
              </div>

              <button
                onClick={() => onApplyFilter('zero')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm self-start sm:self-center transition-all"
              >
                <Filter className="w-3 h-3" />
                <span>Filter to Zero Sales</span>
              </button>
            </div>
          </div>

          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Top Cities with Highest Wasted Ad Impressions (Zero Orders):
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topZeroCities.map((item) => (
              <div
                key={item.city}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {item.city}
                  </span>
                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    {item.count} days ₹0
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono">
                  <span>Ad Impressions:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatNumber(item.impressions)}
                  </span>
                </div>
                {onOpenNotesWithTarget && (
                  <button
                    onClick={() => onOpenNotesWithTarget('', item.city)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block"
                  >
                    + Add Analysis Note
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Traffic Leaks */}
      {activeTab === 'leaks' && (
        <div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-500" />
                  <span>Traffic Leaks: High Impressions (≥150) With 0 Sales</span>
                </h4>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Found {leakRecords.length} records where significant ad impressions ran without resulting in even a single order. Ideal targets for ad targeting optimization.
                </p>
              </div>

              <button
                onClick={() => onApplyFilter('traffic_leak')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm self-start sm:self-center transition-all"
              >
                <Filter className="w-3 h-3" />
                <span>Filter Leaks</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {leakRecords.slice(0, 9).map((leak) => (
              <div
                key={leak.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 capitalize">
                  <span>{leak.city}</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">
                    {formatNumber(leak.impressions)} Imp.
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-1">
                  <span>{formatDateWithDay(leak.date)}</span>
                  <span className="text-rose-500 font-semibold">0 Orders (₹0 GMV)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Low Sales */}
      {activeTab === 'low' && (
        <div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                  <span>Low Sales Days (0 &lt; GMV &lt; ₹1,000)</span>
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {lowRecords.length} records generated below ₹1,000 GMV, typically consisting of 1 small order.
                </p>
              </div>

              <button
                onClick={() => onApplyFilter('low')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm self-start sm:self-center transition-all"
              >
                <Filter className="w-3 h-3" />
                <span>Filter Low Sales</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowRecords.slice(0, 9).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 capitalize">
                  <span>{rec.city}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    {formatCurrency(rec.gmv)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-1">
                  <span>{formatDateWithDay(rec.date)}</span>
                  <span>{rec.orders} order ({rec.impressions} Imp.)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: High Sales Spikes */}
      {activeTab === 'high' && (
        <div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-500" />
                  <span>High Sales Spikes (GMV ≥ ₹10,000)</span>
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  {highRecords.length} peak performance records identified. These drive over 80% of total revenue.
                </p>
              </div>

              <button
                onClick={() => onApplyFilter('high')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm self-start sm:self-center transition-all"
              >
                <Filter className="w-3 h-3" />
                <span>Filter Spikes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {spikeDates.map((spike) => (
              <div
                key={spike.id}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white capitalize">
                  <span>{spike.city} ({spike.brand})</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrency(spike.gmv)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  {formatDateWithDay(spike.date)}
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono text-[11px] mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                  <span>{spike.orders} orders ({spike.ntbBuyers} NTB)</span>
                  <span>{formatNumber(spike.impressions)} Imp.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
