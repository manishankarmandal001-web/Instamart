import React, { useState } from 'react';
import { CitySummary } from '../types';
import { formatCurrency, formatNumber, capitalize } from '../utils/formatters';
import { Building2, ArrowUpDown, TrendingUp, AlertCircle, Eye } from 'lucide-react';

interface CityPerformanceChartProps {
  citySummaries: CitySummary[];
  onSelectCity?: (city: string) => void;
}

export const CityPerformanceChart: React.FC<CityPerformanceChartProps> = ({
  citySummaries,
  onSelectCity,
}) => {
  const [sortBy, setSortBy] = useState<'gmv' | 'orders' | 'impressions' | 'zeroSales'>('gmv');
  const [viewCount, setViewCount] = useState<number>(10);

  if (citySummaries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
        No city data available for the current selection.
      </div>
    );
  }

  const sortedCities = [...citySummaries].sort((a, b) => {
    if (sortBy === 'gmv') return b.totalGmv - a.totalGmv;
    if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
    if (sortBy === 'impressions') return b.totalImpressions - a.totalImpressions;
    return b.zeroSalesCount - a.zeroSalesCount;
  });

  const displayedCities = sortedCities.slice(0, viewCount);
  const maxGmv = Math.max(...citySummaries.map((c) => c.totalGmv), 1);
  const maxImpressions = Math.max(...citySummaries.map((c) => c.totalImpressions), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>City-wise Performance & Market Share</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparing sales revenue, order velocity, and ad impression efficiency across top territories
          </p>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSortBy('gmv')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'gmv'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By GMV
            </button>
            <button
              onClick={() => setSortBy('orders')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By Orders
            </button>
            <button
              onClick={() => setSortBy('impressions')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'impressions'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              By Impressions
            </button>
            <button
              onClick={() => setSortBy('zeroSales')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'zeroSales'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Zero-Sales Days
            </button>
          </div>

          <select
            value={viewCount}
            onChange={(e) => setViewCount(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={25}>All ({citySummaries.length})</option>
          </select>
        </div>
      </div>

      {/* City Bar Rows */}
      <div className="space-y-3.5">
        {displayedCities.map((city, idx) => {
          const gmvPercent = (city.totalGmv / maxGmv) * 100;
          const impPercent = (city.totalImpressions / maxImpressions) * 100;
          const isTopMarket = idx === 0;
          const isHighZeroSales = city.zeroSalesCount > 5;

          return (
            <div
              key={city.city}
              onClick={() => onSelectCity && onSelectCity(city.city)}
              className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-[11px] font-mono text-slate-400 font-bold">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize text-sm">
                    {city.city}
                  </span>
                  {isTopMarket && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      Top Market
                    </span>
                  )}
                  {isHighZeroSales && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {city.zeroSalesCount} days 0 sales
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">GMV</span>
                    <strong className="text-slate-900 dark:text-white">
                      {formatCurrency(city.totalGmv)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Orders</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {city.totalOrders}
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-slate-400 text-[10px] block">Impressions</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      {formatNumber(city.totalImpressions)}
                    </span>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-slate-400 text-[10px] block">Conv. Rate</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {city.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bars: GMV bar (Indigo) and Impressions bar (Sky) */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(gmvPercent, 1)}%` }}
                  />
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden opacity-60">
                  <div
                    className="bg-sky-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(impPercent, 1)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 mt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2 rounded bg-indigo-600 inline-block" /> GMV Sales Share
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 rounded bg-sky-500 inline-block" /> Ad Impressions Volume
          </span>
        </div>
        <span>Click city to filter</span>
      </div>
    </div>
  );
};
