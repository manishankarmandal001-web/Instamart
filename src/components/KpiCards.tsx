import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Eye,
  UserCheck,
  AlertOctagon,
  Percent,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency, formatFullCurrency, formatNumber } from '../utils/formatters';
import { PerformanceFilter } from '../types';

interface KpiCardsProps {
  totalGmv: number;
  totalOrders: number;
  totalImpressions: number;
  totalNtb: number;
  zeroSalesCount: number;
  lowSalesCount: number;
  highSalesCount: number;
  trafficLeakCount: number;
  wastedImpressions: number;
  onFilterByTier: (tier: PerformanceFilter) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalGmv,
  totalOrders,
  totalImpressions,
  totalNtb,
  zeroSalesCount,
  lowSalesCount,
  highSalesCount,
  trafficLeakCount,
  wastedImpressions,
  onFilterByTier,
}) => {
  const aov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;
  const ntbPercentage = totalOrders > 0 ? ((totalNtb / totalOrders) * 100).toFixed(1) : '0';
  const conversionRate = totalImpressions > 0 ? ((totalOrders / totalImpressions) * 100).toFixed(2) : '0';
  const rpm = totalImpressions > 0 ? ((totalGmv / totalImpressions) * 1000).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total GMV / Sales */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Gross Sales (GMV)
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalGmv)}
          </h2>
          <span className="text-xs text-slate-400 font-mono hidden xl:inline">({formatFullCurrency(totalGmv)})</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">Average Order (AOV)</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹{aov.toLocaleString()}</span>
        </div>
      </div>

      {/* 2. Total Orders & NTB Buyers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Orders & NTB
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatNumber(totalOrders)}
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {ntbPercentage}% New
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">New-to-Brand Buyers</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatNumber(totalNtb)} buyers</span>
        </div>
      </div>

      {/* 3. Ads Impressions & Efficiency */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ad Impressions & Reach
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatNumber(totalImpressions)}
          </h2>
          <span className="text-xs text-sky-600 dark:text-sky-400 font-medium font-mono">
            {conversionRate}% Conv.
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">RPM (GMV / 1k Imp)</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹{rpm}</span>
        </div>
      </div>

      {/* 4. Anomaly / Zero & Low Sales Filter Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Zero Sales & Traffic Leaks</span>
          </span>
          <button
            onClick={() => onFilterByTier('zero')}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center"
          >
            Filter <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {zeroSalesCount}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            city-days with 0 sales
          </span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400">Wasted Ad Impressions</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatNumber(wastedImpressions)}
          </span>
        </div>
      </div>
    </div>
  );
};
