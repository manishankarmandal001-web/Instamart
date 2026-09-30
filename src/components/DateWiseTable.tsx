import React, { useState } from 'react';
import { DailySummary } from '../types';
import { formatCurrency, formatNumber, formatDateWithDay, capitalize } from '../utils/formatters';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { SalesRecord } from '../data/initialData';

interface DateWiseTableProps {
  dailySummaries: DailySummary[];
  allFilteredRecords: SalesRecord[];
  onOpenNotesWithTarget?: (date: string, city: string) => void;
}

export const DateWiseTable: React.FC<DateWiseTableProps> = ({
  dailySummaries,
  allFilteredRecords,
  onOpenNotesWithTarget,
}) => {
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});
  const [tableSearch, setTableSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'gmv' | 'orders' | 'impressions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const expandAll = () => {
    const all: { [date: string]: boolean } = {};
    dailySummaries.forEach((d) => {
      all[d.date] = true;
    });
    setExpandedDates(all);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  // Sorting
  const sortedSummaries = [...dailySummaries].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'date') diff = a.date.localeCompare(b.date);
    else if (sortBy === 'gmv') diff = a.totalGmv - b.totalGmv;
    else if (sortBy === 'orders') diff = a.totalOrders - b.totalOrders;
    else if (sortBy === 'impressions') diff = a.totalImpressions - b.totalImpressions;
    return sortOrder === 'desc' ? -diff : diff;
  });

  const filteredSummaries = sortedSummaries.filter(
    (d) =>
      d.date.includes(tableSearch) ||
      d.dayOfWeek.toLowerCase().includes(tableSearch.toLowerCase()) ||
      d.topCity.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const handleSort = (field: 'date' | 'gmv' | 'orders' | 'impressions') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // CSV Export functionality
  const handleExportCsv = () => {
    const headers = [
      'Brand',
      'Date',
      'Day of Week',
      'City',
      'NTB Buyers',
      'Impressions',
      'GMV (INR)',
      'Orders',
      'AOV',
      'Conversion Rate (%)',
      'RPM',
      'Sales Tier',
    ];

    const rows = allFilteredRecords.map((r) => [
      r.brand,
      r.date,
      r.dayOfWeek,
      r.city,
      r.ntbBuyers,
      r.impressions,
      r.gmv,
      r.orders,
      r.aov,
      r.conversionRate,
      r.rpm,
      r.salesTier,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trrop_sales_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Date-wise Sales & City Matrix (Daily Timeline)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Day-by-day analysis with nested city-level drills, anomaly alerts, and CSV export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Expand / Collapse */}
          <button
            onClick={expandAll}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Collapse All
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Search Filter */}
      <div className="relative mb-3 max-w-xs">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter date or city..."
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-3 w-8"></th>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gmv')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Gross GMV</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('orders')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Orders (NTB)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('impressions')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Ad Impressions</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Conv. %</th>
              <th className="py-3 px-3 text-left">Top Contributing City</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSummaries.map((day) => {
              const isExpanded = !!expandedDates[day.date];
              const isPeakDay = day.totalGmv >= 35000;
              const hasZeroSales = day.zeroSalesCount > 0;

              return (
                <React.Fragment key={day.date}>
                  {/* Master Date Row */}
                  <tr
                    onClick={() => toggleExpand(day.date)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{formatDateWithDay(day.date)}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {day.recordsCount} city records
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(day.totalGmv)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      <strong>{day.totalOrders}</strong>{' '}
                      <span className="text-slate-400 text-[11px]">({day.totalNtb} NTB)</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-sky-600 dark:text-sky-400 font-semibold">
                      {formatNumber(day.totalImpressions)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {day.conversionRate}%
                    </td>

                    <td className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{day.topCity || 'None'}</span>{' '}
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({formatCurrency(day.topCityGmv)})
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isPeakDay ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          High Peak
                        </span>
                      ) : day.totalGmv === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Zero Sales
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Standard
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Sub-Table: All Cities on this Date */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="p-0 bg-slate-50/70 dark:bg-slate-900/60">
                        <div className="py-3 px-6 border-y border-indigo-100 dark:border-indigo-950/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                              City-level Breakdown for {day.date}:
                            </span>
                            {onOpenNotesWithTarget && (
                              <button
                                onClick={() => onOpenNotesWithTarget(day.date, '')}
                                className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Add Date Note</span>
                              </button>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                              <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold">
                                <tr>
                                  <th className="py-2 px-3">City</th>
                                  <th className="py-2 px-3">Brand</th>
                                  <th className="py-2 px-3 text-right">Ad Impressions</th>
                                  <th className="py-2 px-3 text-right">Orders</th>
                                  <th className="py-2 px-3 text-right">NTB Buyers</th>
                                  <th className="py-2 px-3 text-right">Gross GMV</th>
                                  <th className="py-2 px-3 text-right">AOV</th>
                                  <th className="py-2 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {day.records.map((rec) => {
                                  const isZero = rec.gmv === 0;
                                  return (
                                    <tr
                                      key={rec.id}
                                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 font-mono text-[11px]"
                                    >
                                      <td className="py-2 px-3 capitalize font-bold text-slate-800 dark:text-slate-200">
                                        {rec.city}
                                      </td>
                                      <td className="py-2 px-3 uppercase text-slate-500 dark:text-slate-400">
                                        {rec.brand}
                                      </td>
                                      <td className="py-2 px-3 text-right text-sky-600 dark:text-sky-400">
                                        {formatNumber(rec.impressions)}
                                      </td>
                                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-200">
                                        {rec.orders}
                                      </td>
                                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">
                                        {rec.ntbBuyers}
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                                        {rec.gmv > 0 ? `₹${rec.gmv.toLocaleString()}` : '₹0'}
                                      </td>
                                      <td className="py-2 px-3 text-right text-slate-500">
                                        {rec.aov > 0 ? `₹${rec.aov.toLocaleString()}` : '-'}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        {isZero ? (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                                            Zero Sales
                                          </span>
                                        ) : rec.gmv >= 10000 ? (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                            Spike
                                          </span>
                                        ) : (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            Active
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
