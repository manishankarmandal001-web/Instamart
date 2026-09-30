import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import { INITIAL_SALES_DATA, SalesRecord } from './data/initialData';
import { FilterState, PerformanceFilter, DailySummary, CitySummary, BrandSummary } from './types';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { DateTimelineChart } from './components/DateTimelineChart';
import { CityPerformanceChart } from './components/CityPerformanceChart';
import { BrandComparison } from './components/BrandComparison';
import { AnomalySection } from './components/AnomalySection';
import { DateWiseTable } from './components/DateWiseTable';
import { AdsAnalyticsTab } from './components/AdsAnalyticsTab';
import { DayOfWeekChart } from './components/DayOfWeekChart';
import { NotesAndSyncModal } from './components/NotesAndSyncModal';
import { ExcelUploadTab } from './components/ExcelUploadTab';
import {
  SavedFilter,
  DataNote,
  subscribeSavedFilters,
  subscribeCustomRecords,
  subscribeDataNotes,
} from './firebase/firestoreService';
import {
  BarChart3,
  Calendar,
  Layers,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Database,
  RefreshCw,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatNumber } from './utils/formatters';

function TrropDashboard() {
  const { user, firebaseConnected } = useAuth();

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('trrop_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('trrop_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('trrop_theme', 'light');
    }
  }, [darkMode]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'ads' | 'anomalies' | 'datewise' | 'upload' | 'notes'>('overview');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState<string>('2026-09-12');
  const [modalTargetCity, setModalTargetCity] = useState<string>('Bangalore');

  // Uploaded dataset state (from Excel/CSV import)
  const [uploadedDataset, setUploadedDataset] = useState<{ records: SalesRecord[]; mode: 'replace' | 'merge' } | null>(null);

  // Firebase Real-time sync states
  const [customRecords, setCustomRecords] = useState<SalesRecord[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [notes, setNotes] = useState<DataNote[]>([]);

  useEffect(() => {
    if (!user) {
      setCustomRecords([]);
      setSavedFilters([]);
      return;
    }

    const unsubFilters = subscribeSavedFilters(user.uid, (filters) => {
      setSavedFilters(filters);
    });

    const unsubRecords = subscribeCustomRecords(user.uid, (records) => {
      setCustomRecords(records);
    });

    const unsubNotes = subscribeDataNotes((fetchedNotes) => {
      setNotes(fetchedNotes);
    });

    return () => {
      unsubFilters();
      unsubRecords();
      unsubNotes();
    };
  }, [user]);

  // Combine datasets dynamically based on user upload and Firebase sync
  const allRecords = useMemo(() => {
    if (uploadedDataset) {
      if (uploadedDataset.mode === 'replace') {
        return [...customRecords, ...uploadedDataset.records];
      }
      return [...uploadedDataset.records, ...customRecords, ...INITIAL_SALES_DATA];
    }
    if (customRecords.length === 0) return INITIAL_SALES_DATA;
    return [...customRecords, ...INITIAL_SALES_DATA];
  }, [customRecords, uploadedDataset]);

  const handleLoadUploadedRecords = (records: SalesRecord[], mode: 'replace' | 'merge') => {
    setUploadedDataset({ records, mode });
    setActiveTab('overview');
  };

  // Extract available unique cities and brands
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => set.add(r.city.toLowerCase()));
    return Array.from(set).sort();
  }, [allRecords]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => set.add(r.brand.toLowerCase()));
    return Array.from(set).sort();
  }, [allRecords]);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    brand: 'all',
    startDate: '2026-09-01',
    endDate: '2026-09-29',
    selectedCities: [],
    performance: 'all',
    dayOfWeek: 'All',
    searchTerm: '',
  });

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // Brand filter
      if (filter.brand !== 'all' && rec.brand.toLowerCase() !== filter.brand.toLowerCase()) {
        return false;
      }
      // Date range filter
      if (rec.date < filter.startDate || rec.date > filter.endDate) {
        return false;
      }
      // City filter
      if (filter.selectedCities.length > 0 && !filter.selectedCities.includes(rec.city.toLowerCase())) {
        return false;
      }
      // Performance / Sales tier filter
      if (filter.performance === 'zero' && rec.salesTier !== 'zero') return false;
      if (filter.performance === 'low' && rec.salesTier !== 'low') return false;
      if (filter.performance === 'medium' && rec.salesTier !== 'medium') return false;
      if (filter.performance === 'high' && rec.salesTier !== 'high') return false;
      if (filter.performance === 'traffic_leak' && !rec.isTrafficLeak) return false;
      if (filter.performance === 'spikes' && !rec.isSpike) return false;

      // Day of Week filter
      if (filter.dayOfWeek !== 'All' && rec.dayOfWeek !== filter.dayOfWeek) {
        return false;
      }

      // Search term filter
      if (filter.searchTerm.trim()) {
        const term = filter.searchTerm.toLowerCase();
        const matchesCity = rec.city.toLowerCase().includes(term);
        const matchesBrand = rec.brand.toLowerCase().includes(term);
        const matchesDate = rec.date.includes(term);
        if (!matchesCity && !matchesBrand && !matchesDate) return false;
      }

      return true;
    });
  }, [allRecords, filter]);

  // Computed KPI Metrics
  const totalGmv = useMemo(() => filteredRecords.reduce((s, r) => s + r.gmv, 0), [filteredRecords]);
  const totalOrders = useMemo(() => filteredRecords.reduce((s, r) => s + r.orders, 0), [filteredRecords]);
  const totalImpressions = useMemo(() => filteredRecords.reduce((s, r) => s + r.impressions, 0), [filteredRecords]);
  const totalNtb = useMemo(() => filteredRecords.reduce((s, r) => s + r.ntbBuyers, 0), [filteredRecords]);
  const zeroSalesCount = useMemo(() => filteredRecords.filter((r) => r.salesTier === 'zero').length, [filteredRecords]);
  const lowSalesCount = useMemo(() => filteredRecords.filter((r) => r.salesTier === 'low').length, [filteredRecords]);
  const highSalesCount = useMemo(() => filteredRecords.filter((r) => r.salesTier === 'high').length, [filteredRecords]);
  const trafficLeakCount = useMemo(() => filteredRecords.filter((r) => r.isTrafficLeak).length, [filteredRecords]);
  const wastedImpressions = useMemo(
    () => filteredRecords.filter((r) => r.salesTier === 'zero').reduce((s, r) => s + r.impressions, 0),
    [filteredRecords]
  );

  // Group by Date for Daily Summary
  const dailySummaries: DailySummary[] = useMemo(() => {
    const map: { [date: string]: SalesRecord[] } = {};
    filteredRecords.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });

    const dates = Object.keys(map).sort();
    return dates.map((date) => {
      const records = map[date];
      const gmv = records.reduce((s, r) => s + r.gmv, 0);
      const orders = records.reduce((s, r) => s + r.orders, 0);
      const impressions = records.reduce((s, r) => s + r.impressions, 0);
      const ntb = records.reduce((s, r) => s + r.ntbBuyers, 0);
      const zeroCount = records.filter((r) => r.salesTier === 'zero').length;

      // Find top city on this date
      const citySums: { [city: string]: number } = {};
      records.forEach((r) => {
        citySums[r.city] = (citySums[r.city] || 0) + r.gmv;
      });
      let topCity = '';
      let topCityGmv = 0;
      Object.entries(citySums).forEach(([c, val]) => {
        if (val > topCityGmv) {
          topCityGmv = val;
          topCity = c;
        }
      });

      return {
        date,
        dayOfWeek: records[0]?.dayOfWeek || '',
        totalGmv: gmv,
        totalOrders: orders,
        totalImpressions: impressions,
        totalNtb: ntb,
        aov: orders > 0 ? Math.round(gmv / orders) : 0,
        conversionRate: impressions > 0 ? Number(((orders / impressions) * 100).toFixed(2)) : 0,
        rpm: impressions > 0 ? Number(((gmv / impressions) * 1000).toFixed(1)) : 0,
        recordsCount: records.length,
        zeroSalesCount: zeroCount,
        topCity,
        topCityGmv,
        records,
      };
    });
  }, [filteredRecords]);

  // Group by City Summary
  const citySummaries: CitySummary[] = useMemo(() => {
    const map: { [city: string]: SalesRecord[] } = {};
    filteredRecords.forEach((r) => {
      if (!map[r.city]) map[r.city] = [];
      map[r.city].push(r);
    });

    return Object.entries(map).map(([city, records]) => {
      const gmv = records.reduce((s, r) => s + r.gmv, 0);
      const orders = records.reduce((s, r) => s + r.orders, 0);
      const impressions = records.reduce((s, r) => s + r.impressions, 0);
      const ntb = records.reduce((s, r) => s + r.ntbBuyers, 0);
      const zeroCount = records.filter((r) => r.salesTier === 'zero').length;

      return {
        city,
        totalGmv: gmv,
        totalOrders: orders,
        totalImpressions: impressions,
        totalNtb: ntb,
        conversionRate: impressions > 0 ? Number(((orders / impressions) * 100).toFixed(2)) : 0,
        rpm: impressions > 0 ? Number(((gmv / impressions) * 1000).toFixed(1)) : 0,
        recordsCount: records.length,
        zeroSalesCount: zeroCount,
      };
    });
  }, [filteredRecords]);

  // Group by Brand Summary
  const brandSummaries: BrandSummary[] = useMemo(() => {
    const map: { [brand: string]: SalesRecord[] } = {};
    filteredRecords.forEach((r) => {
      if (!map[r.brand]) map[r.brand] = [];
      map[r.brand].push(r);
    });

    return Object.entries(map).map(([brand, records]) => {
      const gmv = records.reduce((s, r) => s + r.gmv, 0);
      const orders = records.reduce((s, r) => s + r.orders, 0);
      const impressions = records.reduce((s, r) => s + r.impressions, 0);
      const ntb = records.reduce((s, r) => s + r.ntbBuyers, 0);

      return {
        brand,
        totalGmv: gmv,
        totalOrders: orders,
        totalImpressions: impressions,
        totalNtb: ntb,
        aov: orders > 0 ? Math.round(gmv / orders) : 0,
        conversionRate: impressions > 0 ? Number(((orders / impressions) * 100).toFixed(2)) : 0,
        recordsCount: records.length,
      };
    });
  }, [filteredRecords]);

  const handleFilterByTier = (tier: PerformanceFilter) => {
    setFilter((prev) => ({ ...prev, performance: tier }));
  };

  const handleOpenNotesWithTarget = (date: string, city: string) => {
    setModalTargetDate(date || '2026-09-12');
    setModalTargetCity(city || 'Bangalore');
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        totalRecordsCount={filteredRecords.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top welcome and quick stats banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                E-Commerce Intelligence
              </span>
              {firebaseConnected && (
                <span className="text-xs font-bold flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Firebase Connected</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trrop Analytics Platform
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl mt-1">
              Analyzing brand metrics, orders, NTB buyers, ad impressions, and anomaly performance across 24 Indian cities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upload Excel / PDF Report</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-indigo-300" />
              <span>Team Notes & Sync</span>
            </button>
          </div>
        </div>

        {/* Uploaded Dataset Active Banner */}
        {uploadedDataset && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Active Analysis: Custom uploaded spreadsheet (
                <strong>{uploadedDataset.records.length} records</strong>, mode:{' '}
                <strong>{uploadedDataset.mode}</strong>).
              </span>
            </div>
            <button
              onClick={() => setUploadedDataset(null)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revert to Default Data</span>
            </button>
          </div>
        )}

        {/* Global Multi-dimensional Filter Bar */}
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          availableCities={availableCities}
          availableBrands={availableBrands}
          savedFilters={savedFilters}
          totalFilteredCount={filteredRecords.length}
          totalRawCount={allRecords.length}
        />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <KpiCards
              totalGmv={totalGmv}
              totalOrders={totalOrders}
              totalImpressions={totalImpressions}
              totalNtb={totalNtb}
              zeroSalesCount={zeroSalesCount}
              lowSalesCount={lowSalesCount}
              highSalesCount={highSalesCount}
              trafficLeakCount={trafficLeakCount}
              wastedImpressions={wastedImpressions}
              onFilterByTier={handleFilterByTier}
            />

            <DateTimelineChart
              dailyData={dailySummaries}
              onSelectDate={(date) => {
                setFilter((p) => ({ ...p, startDate: date, endDate: date }));
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CityPerformanceChart
                citySummaries={citySummaries}
                onSelectCity={(city) => {
                  setFilter((p) => ({ ...p, selectedCities: [city] }));
                }}
              />
              <BrandComparison
                brandSummaries={brandSummaries}
                onSelectBrand={(brand) => {
                  setFilter((p) => ({ ...p, brand }));
                }}
              />
            </div>

            <AnomalySection
              records={filteredRecords}
              onApplyFilter={handleFilterByTier}
              onOpenNotesWithTarget={handleOpenNotesWithTarget}
            />
          </div>
        )}

        {/* Tab 2: Sales Deep Dive */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <KpiCards
              totalGmv={totalGmv}
              totalOrders={totalOrders}
              totalImpressions={totalImpressions}
              totalNtb={totalNtb}
              zeroSalesCount={zeroSalesCount}
              lowSalesCount={lowSalesCount}
              highSalesCount={highSalesCount}
              trafficLeakCount={trafficLeakCount}
              wastedImpressions={wastedImpressions}
              onFilterByTier={handleFilterByTier}
            />

            <DateTimelineChart
              dailyData={dailySummaries}
              onSelectDate={(date) => {
                setFilter((p) => ({ ...p, startDate: date, endDate: date }));
              }}
            />

            <DayOfWeekChart records={filteredRecords} />

            <CityPerformanceChart
              citySummaries={citySummaries}
              onSelectCity={(city) => {
                setFilter((p) => ({ ...p, selectedCities: [city] }));
              }}
            />
          </div>
        )}

        {/* Tab 3: Ads & Impressions Analysis */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <AdsAnalyticsTab records={filteredRecords} />
            <DateTimelineChart
              dailyData={dailySummaries}
              onSelectDate={(date) => {
                setFilter((p) => ({ ...p, startDate: date, endDate: date }));
              }}
            />
          </div>
        )}

        {/* Tab 4: Anomaly & Zero/Low Sales Filtering */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <AnomalySection
              records={filteredRecords}
              onApplyFilter={handleFilterByTier}
              onOpenNotesWithTarget={handleOpenNotesWithTarget}
            />
            <DateWiseTable
              dailySummaries={dailySummaries}
              allFilteredRecords={filteredRecords}
              onOpenNotesWithTarget={handleOpenNotesWithTarget}
            />
          </div>
        )}

        {/* Tab 5: Date-wise Daily Matrix */}
        {activeTab === 'datewise' && (
          <div className="space-y-6">
            <DateTimelineChart
              dailyData={dailySummaries}
              onSelectDate={(date) => {
                setFilter((p) => ({ ...p, startDate: date, endDate: date }));
              }}
            />
            <DateWiseTable
              dailySummaries={dailySummaries}
              allFilteredRecords={filteredRecords}
              onOpenNotesWithTarget={handleOpenNotesWithTarget}
            />
          </div>
        )}

        {/* Tab 6: Excel Upload & PDF Report Generator */}
        {activeTab === 'upload' && (
          <ExcelUploadTab
            currentRecords={filteredRecords}
            dailySummaries={dailySummaries}
            citySummaries={citySummaries}
            brandSummaries={brandSummaries}
            onLoadUploadedRecords={handleLoadUploadedRecords}
          />
        )}

        {/* Tab 7: Real-time Notes & Custom Records */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <span>Collaborative Real-Time Annotations</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sync performance explanations, marketing observations, and ad campaign feedback with your team via Firebase Firestore
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Open Notes & Add Data Modal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                      <span>{note.date}</span>
                      <span className="capitalize">{note.city || 'All Cities'}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 mb-3">{note.note}</p>
                    <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-2 flex items-center justify-between">
                      <span>{note.userEmail}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Real-time Notes & Add Custom Data Modal */}
      <NotesAndSyncModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        notes={notes}
        defaultDate={modalTargetDate}
        defaultCity={modalTargetCity}
        onRecordAdded={() => {}}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200">Trrop</span>
            <span>• E-Commerce Sales & Ads Analytics Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Ready for Vercel deployment</span>
            <span>•</span>
            <span>Firebase Firestore & Auth Enabled</span>
            <span>•</span>
            <span>Data synced up to Sept 29, 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TrropDashboard />
    </AuthProvider>
  );
}
