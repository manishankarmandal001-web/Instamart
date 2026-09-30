import React, { useState } from 'react';
import { SalesRecord } from '../data/initialData';
import { formatCurrency, formatNumber, capitalize } from '../utils/formatters';
import { Eye, TrendingUp, Layers, CheckCircle2, AlertOctagon, HelpCircle, ArrowUpRight } from 'lucide-react';

interface AdsAnalyticsTabProps {
  records: SalesRecord[];
}

export const AdsAnalyticsTab: React.FC<AdsAnalyticsTabProps> = ({ records }) => {
  const totalImpressions = records.reduce((s, r) => s + r.impressions, 0);
  const totalGmv = records.reduce((s, r) => s + r.gmv, 0);
  const totalOrders = records.reduce((s, r) => s + r.orders, 0);
  const overallConversion = totalImpressions > 0 ? ((totalOrders / totalImpressions) * 100).toFixed(2) : '0';
  const overallRpm = totalImpressions > 0 ? ((totalGmv / totalImpressions) * 1000).toFixed(1) : '0';

  // Group by city for ad efficiency
  const cityMap: { [city: string]: { impressions: number; gmv: number; orders: number; records: number } } = {};
  records.forEach((r) => {
    if (!cityMap[r.city]) {
      cityMap[r.city] = { impressions: 0, gmv: 0, orders: 0, records: 0 };
    }
    cityMap[r.city].impressions += r.impressions;
    cityMap[r.city].gmv += r.gmv;
    cityMap[r.city].orders += r.orders;
    cityMap[r.city].records += 1;
  });

  const cityAdStats = Object.entries(cityMap)
    .map(([city, data]) => {
      const conv = data.impressions > 0 ? ((data.orders / data.impressions) * 100).toFixed(2) : '0';
      const rpm = data.impressions > 0 ? ((data.gmv / data.impressions) * 1000).toFixed(1) : '0';
      return {
        city,
        ...data,
        convRate: Number(conv),
        rpm: Number(rpm),
      };
    })
    .sort((a, b) => b.impressions - a.impressions);

  // Impressions split: Converted vs Wasted
  const zeroSalesImpressions = records.filter((r) => r.gmv === 0).reduce((s, r) => s + r.impressions, 0);
  const convertedImpressions = totalImpressions - zeroSalesImpressions;
  const zeroSalesImpPercent = totalImpressions > 0 ? ((zeroSalesImpressions / totalImpressions) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Total Ad Impressions</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatNumber(totalImpressions)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Across all brand ad placements</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Ad Monetization RPM</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{overallRpm}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Gross GMV generated per 1,000 impressions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Overall Conversion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {overallConversion}%
          </h3>
          <p className="text-xs text-slate-400 mt-1">{totalOrders} orders from {formatNumber(totalImpressions)} views</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
            <span>Zero-Yield Ad Volume</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatNumber(zeroSalesImpressions)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{zeroSalesImpPercent}% of all ad impressions yielded 0 sales</p>
        </div>
      </div>

      {/* City Ad Efficiency Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          City-Level Ad Efficiency & Monetization Matrix
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Detailed breakdown of impression share vs resulting sales revenue and conversion percentage by territory
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-right">Ad Impressions</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Gross GMV</th>
                <th className="py-2.5 px-3 text-right">Conversion %</th>
                <th className="py-2.5 px-3 text-right">RPM (₹/1k Imp)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cityAdStats.map((item) => {
                const isZero = item.gmv === 0;
                const isHighYield = item.rpm > 1000;
                return (
                  <tr
                    key={item.city}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {item.city}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {formatNumber(item.impressions)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {item.orders}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.gmv)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.convRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      ₹{item.rpm.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isZero ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Zero Yield
                        </span>
                      ) : isHighYield ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          High Yield
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
