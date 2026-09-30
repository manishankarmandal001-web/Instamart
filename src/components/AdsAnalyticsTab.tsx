import React, { useState, useMemo } from 'react';
import { SalesRecord } from '../data/initialData';
import { formatCurrency, formatNumber, capitalize } from '../utils/formatters';
import {
  Eye,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Building2,
  Calendar,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface AdsAnalyticsTabProps {
  records: SalesRecord[];
}

export const AdsAnalyticsTab: React.FC<AdsAnalyticsTabProps> = ({ records }) => {
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [efficiencyFilter, setEfficiencyFilter] = useState<'all' | 'high' | 'zero'>('all');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedBrandFilter !== 'all' && r.brand.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return false;
      }
      if (efficiencyFilter === 'zero' && r.gmv > 0) return false;
      if (efficiencyFilter === 'high' && r.rpm <= 1000) return false;
      return true;
    });
  }, [records, selectedBrandFilter, efficiencyFilter]);

  // Overall metrics
  const totalImpressions = useMemo(() => filteredRecords.reduce((s, r) => s + r.impressions, 0), [filteredRecords]);
  const totalGmv = useMemo(() => filteredRecords.reduce((s, r) => s + r.gmv, 0), [filteredRecords]);
  const totalOrders = useMemo(() => filteredRecords.reduce((s, r) => s + r.orders, 0), [filteredRecords]);
  const overallConversion = totalImpressions > 0 ? ((totalOrders / totalImpressions) * 100).toFixed(2) : '0';
  const overallRpm = totalImpressions > 0 ? ((totalGmv / totalImpressions) * 1000).toFixed(1) : '0';

  // Zero sales wasted impressions
  const zeroSalesImpressions = useMemo(
    () => filteredRecords.filter((r) => r.gmv === 0).reduce((s, r) => s + r.impressions, 0),
    [filteredRecords]
  );
  const zeroSalesImpPercent = totalImpressions > 0 ? ((zeroSalesImpressions / totalImpressions) * 100).toFixed(1) : '0';

  // Brand-level impressions analysis
  const brandStats = useMemo(() => {
    const map: {
      [brand: string]: {
        brand: string;
        impressions: number;
        gmv: number;
        orders: number;
        ntbBuyers: number;
        records: number;
        zeroSalesImpressions: number;
      };
    } = {};

    records.forEach((r) => {
      const bKey = r.brand || 'General';
      if (!map[bKey]) {
        map[bKey] = {
          brand: bKey,
          impressions: 0,
          gmv: 0,
          orders: 0,
          ntbBuyers: 0,
          records: 0,
          zeroSalesImpressions: 0,
        };
      }
      map[bKey].impressions += r.impressions;
      map[bKey].gmv += r.gmv;
      map[bKey].orders += r.orders;
      map[bKey].ntbBuyers += r.ntbBuyers;
      map[bKey].records += 1;
      if (r.gmv === 0) {
        map[bKey].zeroSalesImpressions += r.impressions;
      }
    });

    const grandTotalImpressions = records.reduce((s, r) => s + r.impressions, 0) || 1;

    return Object.values(map)
      .map((item) => {
        const convRate = item.impressions > 0 ? Number(((item.orders / item.impressions) * 100).toFixed(2)) : 0;
        const rpm = item.impressions > 0 ? Number(((item.gmv / item.impressions) * 1000).toFixed(1)) : 0;
        const shareOfVoice = Number(((item.impressions / grandTotalImpressions) * 100).toFixed(1));
        const wastePercent = item.impressions > 0 ? Number(((item.zeroSalesImpressions / item.impressions) * 100).toFixed(1)) : 0;

        return {
          ...item,
          convRate,
          rpm,
          shareOfVoice,
          wastePercent,
        };
      })
      .sort((a, b) => b.impressions - a.impressions);
  }, [records]);

  // Available brands list
  const availableBrands = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.brand.toLowerCase()))).sort();
  }, [records]);

  // City-level ad efficiency
  const cityAdStats = useMemo(() => {
    const cityMap: { [city: string]: { impressions: number; gmv: number; orders: number; records: number } } = {};
    filteredRecords.forEach((r) => {
      const c = r.city || 'general';
      if (!cityMap[c]) {
        cityMap[c] = { impressions: 0, gmv: 0, orders: 0, records: 0 };
      }
      cityMap[c].impressions += r.impressions;
      cityMap[c].gmv += r.gmv;
      cityMap[c].orders += r.orders;
      cityMap[c].records += 1;
    });

    return Object.entries(cityMap)
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
  }, [filteredRecords]);

  // Daily Impression Trend
  const dailyImpressionTrend = useMemo(() => {
    const dateMap: { [date: string]: { date: string; impressions: number; gmv: number; orders: number } } = {};
    filteredRecords.forEach((r) => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, impressions: 0, gmv: 0, orders: 0 };
      }
      dateMap[r.date].impressions += r.impressions;
      dateMap[r.date].gmv += r.gmv;
      dateMap[r.date].orders += r.orders;
    });

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const maxDailyImpressions = useMemo(() => {
    return Math.max(...dailyImpressionTrend.map((d) => d.impressions), 1);
  }, [dailyImpressionTrend]);

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <Eye className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Ad Impressions Data Loaded
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload your sales or ads spreadsheet in the &quot;Excel &amp; PDF Report&quot; tab to analyze brand impressions, ad monetization RPM, and traffic leaks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Brand &amp; Ads Filter:
          </span>
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Brands ({availableBrands.length})</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>
                {capitalize(b)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setEfficiencyFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              efficiencyFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Ad Records
          </button>
          <button
            onClick={() => setEfficiencyFilter('high')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              efficiencyFilter === 'high'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            High Monetization (RPM &gt; ₹1k)
          </button>
          <button
            onClick={() => setEfficiencyFilter('zero')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              efficiencyFilter === 'zero'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Zero Sales (Wasted)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Total Brand Impressions</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatNumber(totalImpressions)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Across all ad placements &amp; search views</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Ad Monetization RPM</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            ₹{overallRpm}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Gross sales generated per 1,000 impressions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Overall Conversion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {overallConversion}%
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {totalOrders} orders from {formatNumber(totalImpressions)} impressions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
            <span>Zero-Yield Ad Volume</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatNumber(zeroSalesImpressions)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {zeroSalesImpPercent}% of impressions yielded ₹0 sales
          </p>
        </div>
      </div>

      {/* Brand Impression Analysis Matrix (The core fix for Brand Impressions) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Brand-Wise Ad Impressions &amp; Monetization Audit</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive comparison of brand impressions, market share of voice, conversion efficiency, and revenue yield
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {brandStats.length} Brands Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Brand Name</th>
                <th className="py-3 px-3 text-right">Brand Impressions</th>
                <th className="py-3 px-3 text-left">Share of Voice</th>
                <th className="py-3 px-3 text-right">Ad Orders</th>
                <th className="py-3 px-3 text-right">Generated GMV</th>
                <th className="py-3 px-3 text-right">Conversion %</th>
                <th className="py-3 px-3 text-right">RPM (₹/1k Imp)</th>
                <th className="py-3 px-3 text-right">Zero-Sales Imp</th>
                <th className="py-3 px-3 text-center">Efficiency Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {brandStats.map((item) => {
                const isSelected = selectedBrandFilter === item.brand.toLowerCase();
                const isExcellent = item.rpm >= 1000;
                const isPoor = item.rpm < 200 || item.wastePercent > 50;

                return (
                  <tr
                    key={item.brand}
                    onClick={() => setSelectedBrandFilter(isSelected ? 'all' : item.brand.toLowerCase())}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span>{item.brand}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                      {formatNumber(item.impressions)}
                    </td>
                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${Math.min(100, item.shareOfVoice)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 w-9 text-right">
                          {item.shareOfVoice}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {item.orders}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.gmv)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.convRate}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{item.rpm.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-500">
                      {formatNumber(item.zeroSalesImpressions)}
                      <span className="text-[10px] text-slate-400 ml-1">({item.wastePercent}%)</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isExcellent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          High Yield
                        </span>
                      ) : isPoor ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Low Yield
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Moderate
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

      {/* Daily Ad Impressions Timeline */}
      {dailyImpressionTrend.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Daily Ad Impressions Trend</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volume of impressions served day-by-day across all placements
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Peak: {formatNumber(maxDailyImpressions)} views/day
            </span>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 overflow-x-auto">
            {dailyImpressionTrend.map((d) => {
              const heightPct = Math.max(8, Math.round((d.impressions / maxDailyImpressions) * 100));
              const hasSales = d.gmv > 0;

              return (
                <div
                  key={d.date}
                  className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-slate-900 text-white text-[10px] p-2 rounded-xl shadow-xl whitespace-nowrap">
                    <p className="font-bold">{d.date}</p>
                    <p className="text-sky-300">Impressions: {formatNumber(d.impressions)}</p>
                    <p className="text-emerald-300">GMV: {formatCurrency(d.gmv)}</p>
                    <p className="text-slate-300">Orders: {d.orders}</p>
                  </div>

                  <div
                    className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${
                      hasSales ? 'bg-sky-500 dark:bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* City-Level Ad Efficiency Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>City-Level Ad Impressions &amp; Monetization Matrix</span>
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
                <th className="py-2.5 px-3 text-center">Yield Status</th>
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
