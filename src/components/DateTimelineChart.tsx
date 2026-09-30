import React, { useState } from 'react';
import { DailySummary } from '../types';
import { formatCurrency, formatNumber, formatDateWithDay, formatDate } from '../utils/formatters';
import { Calendar, Eye, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';

interface DateTimelineChartProps {
  dailyData: DailySummary[];
  onSelectDate?: (date: string) => void;
}

export const DateTimelineChart: React.FC<DateTimelineChartProps> = ({ dailyData, onSelectDate }) => {
  const [activeMetric, setActiveMetric] = useState<'gmv' | 'orders' | 'impressions'>('gmv');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (dailyData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
        No date-wise data available for the current filter.
      </div>
    );
  }

  // Calculate scales
  const maxGmv = Math.max(...dailyData.map((d) => d.totalGmv), 1);
  const maxOrders = Math.max(...dailyData.map((d) => d.totalOrders), 1);
  const maxImpressions = Math.max(...dailyData.map((d) => d.totalImpressions), 1);

  const getMetricValue = (d: DailySummary) => {
    if (activeMetric === 'gmv') return d.totalGmv;
    if (activeMetric === 'orders') return d.totalOrders;
    return d.totalImpressions;
  };

  const getMaxValue = () => {
    if (activeMetric === 'gmv') return maxGmv;
    if (activeMetric === 'orders') return maxOrders;
    return maxImpressions;
  };

  const maxValue = getMaxValue();

  // Chart Dimensions
  const height = 280;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 40;
  const innerHeight = height - paddingTop - paddingBottom;
  const chartWidth = 900;
  const innerWidth = chartWidth - paddingX * 2;

  const points = dailyData.map((d, i) => {
    const x = paddingX + (i / Math.max(dailyData.length - 1, 1)) * innerWidth;
    const val = getMetricValue(d);
    const y = paddingTop + innerHeight - (val / maxValue) * innerHeight;
    return { x, y, data: d, val };
  });

  // SVG Path for smooth area
  const linePath = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const midX = (prev.x + curr.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
    : '';

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
      {/* Header and Series Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Date-wise Sales & Traffic Trajectory
            </h3>
            {dailyData.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ({dailyData[0].date} to {dailyData[dailyData.length - 1].date})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive daily performance trend with spike & anomaly detection
          </p>
        </div>

        {/* Metric buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveMetric('gmv')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'gmv'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sales GMV (₹)</span>
          </button>
          <button
            onClick={() => setActiveMetric('orders')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'orders'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveMetric('impressions')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'impressions'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ad Impressions</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto min-w-[700px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + innerHeight * (1 - ratio);
            const val = maxValue * ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {activeMetric === 'gmv' ? formatCurrency(val) : formatNumber(Math.round(val))}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path
            d={areaPath}
            fill={
              activeMetric === 'gmv'
                ? 'url(#gmvGrad)'
                : activeMetric === 'orders'
                ? 'url(#ordersGrad)'
                : 'url(#impGrad)'
            }
          />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={
              activeMetric === 'gmv'
                ? '#6366f1'
                : activeMetric === 'orders'
                ? '#10b981'
                : '#0ea5e9'
            }
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Points & Interactive Elements */}
          {points.map((pt, i) => {
            const isHighSpike = pt.data.totalGmv >= 35000;
            const isZeroSales = pt.data.totalGmv === 0;
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectDate && onSelectDate(pt.data.date)}
              >
                {/* Invisible hover target column */}
                <rect
                  x={pt.x - 12}
                  y={paddingTop}
                  width={24}
                  height={innerHeight + paddingBottom}
                  fill="transparent"
                />

                {/* Point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : isHighSpike ? 5 : 3.5}
                  fill={
                    isZeroSales
                      ? '#ef4444'
                      : isHighSpike
                      ? '#f59e0b'
                      : activeMetric === 'gmv'
                      ? '#6366f1'
                      : activeMetric === 'orders'
                      ? '#10b981'
                      : '#0ea5e9'
                  }
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />

                {/* Spike alert star/badge on highest peak dates */}
                {isHighSpike && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={9}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Date Label on X Axis */}
                {(i % 2 === 0 || isHovered) && (
                  <text
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    className={`text-[10px] font-mono transition-colors ${
                      isHovered
                        ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {formatDate(pt.data.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover guideline */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={paddingTop}
              x2={hoveredPoint.x}
              y2={paddingTop + innerHeight}
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none z-20 bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md min-w-[210px] transition-all"
            style={{
              left: `${Math.min(Math.max(hoveredPoint.x - 100, 20), chartWidth - 230)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
              <span className="font-bold text-xs text-indigo-300">
                {formatDateWithDay(hoveredPoint.data.date)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredPoint.data.recordsCount} cities
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total GMV:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatCurrency(hoveredPoint.data.totalGmv)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orders:</span>
                <span className="font-bold text-slate-100 font-mono">
                  {hoveredPoint.data.totalOrders} ({hoveredPoint.data.totalNtb} NTB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ad Impressions:</span>
                <span className="font-bold text-sky-400 font-mono">
                  {formatNumber(hoveredPoint.data.totalImpressions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Top City:</span>
                <span className="font-semibold text-amber-300 capitalize">
                  {hoveredPoint.data.topCity || 'None'} ({formatCurrency(hoveredPoint.data.topCityGmv)})
                </span>
              </div>
              {hoveredPoint.data.zeroSalesCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-rose-400 pt-1 border-t border-slate-700/60 mt-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>{hoveredPoint.data.zeroSalesCount} zero-sales cities on this date</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & quick hints */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Regular Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>High Sales Peak (≥₹35k GMV)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Zero Sales Alert</span>
          </div>
        </div>
        <span className="text-[11px] italic">Tip: Click any date to drill into city breakdown</span>
      </div>
    </div>
  );
};
