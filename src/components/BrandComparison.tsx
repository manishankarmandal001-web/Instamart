import React from 'react';
import { BrandSummary } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Award, ShoppingCart, Eye, TrendingUp, Users, Compass } from 'lucide-react';

interface BrandComparisonProps {
  brandSummaries: BrandSummary[];
  onSelectBrand?: (brand: string) => void;
}

export const BrandComparison: React.FC<BrandComparisonProps> = ({
  brandSummaries,
  onSelectBrand,
}) => {
  if (brandSummaries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
        No brand metrics available for the current selection.
      </div>
    );
  }

  const totalAllGmv = brandSummaries.reduce((s, b) => s + b.totalGmv, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Brand Metrics & Portfolio Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Performance comparison across all brands in your dataset
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brandSummaries.map((brand) => {
          const share = totalAllGmv > 0 ? ((brand.totalGmv / totalAllGmv) * 100).toFixed(1) : '0';
          const isNafa = brand.brand.toLowerCase() === 'nafa';

          return (
            <div
              key={brand.brand}
              onClick={() => onSelectBrand && onSelectBrand(brand.brand)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white ${
                      isNafa
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400'
                        : 'bg-gradient-to-tr from-amber-600 to-amber-400'
                    }`}
                  >
                    {brand.brand.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      Brand: {brand.brand}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {brand.recordsCount} sales & ad data entries
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {share}% Market GMV
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">{brand.recordsCount} records</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Gross GMV</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {formatCurrency(brand.totalGmv)}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Orders</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {formatNumber(brand.totalOrders)}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">AOV</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    ₹{brand.aov.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-mono">
                <span>Impressions: {formatNumber(brand.totalImpressions)}</span>
                <span>NTB Buyers: {formatNumber(brand.totalNtb)}</span>
                <span>Conv: {brand.conversionRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
