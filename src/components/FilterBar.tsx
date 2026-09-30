import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  Search,
  Calendar,
  Building2,
  TrendingDown,
  TrendingUp,
  Tag,
  BookmarkPlus,
  Check,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { FilterState, PerformanceFilter } from '../types';
import { useAuth } from '../firebase/AuthContext';
import { saveFilterPreset, SavedFilter } from '../firebase/firestoreService';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  availableCities: string[];
  availableBrands: string[];
  savedFilters: SavedFilter[];
  totalFilteredCount: number;
  totalRawCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  availableCities,
  availableBrands,
  savedFilters,
  totalFilteredCount,
  totalRawCount,
}) => {
  const { user } = useAuth();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const performanceOptions: { id: PerformanceFilter; label: string; countDesc: string; color: string }[] = [
    { id: 'all', label: 'All Records', countDesc: 'Full Dataset', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { id: 'zero', label: 'Zero Sales (No Sales)', countDesc: 'GMV = ₹0', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
    { id: 'low', label: 'Low Sales', countDesc: 'GMV < ₹1,000', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
    { id: 'medium', label: 'Medium Sales', countDesc: '₹1k - ₹10k', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
    { id: 'high', label: 'High Sales Spikes', countDesc: 'GMV ≥ ₹10k', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
    { id: 'traffic_leak', label: 'Traffic Leaks', countDesc: '≥150 Imp. & 0 Sales', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  ];

  const datePresets = [
    { label: 'All Dates (Sept 1-29)', start: '2026-09-01', end: '2026-09-29' },
    { label: 'First Half (Sept 1-15)', start: '2026-09-01', end: '2026-09-15' },
    { label: 'Second Half (Sept 16-29)', start: '2026-09-16', end: '2026-09-29' },
    { label: 'Last 7 Days (Sept 23-29)', start: '2026-09-23', end: '2026-09-29' },
  ];

  const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const toggleCity = (city: string) => {
    setFilter((prev) => {
      const exists = prev.selectedCities.includes(city);
      const updated = exists
        ? prev.selectedCities.filter((c) => c !== city)
        : [...prev.selectedCities, city];
      return { ...prev, selectedCities: updated };
    });
  };

  const handleReset = () => {
    setFilter({
      brand: 'all',
      startDate: '2026-09-01',
      endDate: '2026-09-29',
      selectedCities: [],
      performance: 'all',
      dayOfWeek: 'All',
      searchTerm: '',
    });
  };

  const isFiltered =
    filter.brand !== 'all' ||
    filter.startDate !== '2026-09-01' ||
    filter.endDate !== '2026-09-29' ||
    filter.selectedCities.length > 0 ||
    filter.performance !== 'all' ||
    filter.dayOfWeek !== 'All' ||
    filter.searchTerm !== '';

  const handleSavePreset = async () => {
    if (!user) {
      alert('Please sign in with Google to save presets to Firebase.');
      return;
    }
    if (!presetName.trim()) return;

    try {
      await saveFilterPreset(user.uid, presetName.trim(), filter);
      setSaveStatus('Preset saved to Firebase!');
      setTimeout(() => {
        setSaveStatus(null);
        setSaveModalOpen(false);
        setPresetName('');
      }, 1500);
    } catch {
      setSaveStatus('Error saving preset');
    }
  };

  const loadSavedPreset = (preset: SavedFilter) => {
    try {
      const parsed = JSON.parse(preset.filterJson);
      setFilter((prev) => ({ ...prev, ...parsed }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-colors mb-6">
      {/* Top Bar: Search, Stats, Reset, Save Preset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city, brand, or date..."
              value={filter.searchTerm}
              onChange={(e) => setFilter((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {filter.searchTerm && (
              <button
                onClick={() => setFilter((prev) => ({ ...prev, searchTerm: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active records count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{totalFilteredCount}</strong> of{' '}
              {totalRawCount} rows
            </span>
          </div>

          {/* Saved presets selector if any */}
          {savedFilters.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Presets ({savedFilters.length})</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 hidden group-hover:block z-50">
                {savedFilters.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSavedPreset(s)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save current preset */}
          {user && (
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Save current filters to Firebase"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Save Filter</span>
            </button>
          )}

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Performance Tiers (Crucial: Zero, Low, High) */}
      <div className="pt-3 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Performance & Sales Filtering:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {performanceOptions.map((opt) => {
            const isSelected = filter.performance === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFilter((prev) => ({ ...prev, performance: opt.id }))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.countDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Brand, Date Range, Cities, Day of Week */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Brand Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Brand
          </label>
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            {['all', ...availableBrands].map((b) => (
              <button
                key={b}
                onClick={() => setFilter((prev) => ({ ...prev, brand: b }))}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter.brand === b
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {b === 'all' ? 'All Brands' : b}
              </button>
            ))}
          </div>
        </div>

        {/* Date Presets & Custom Picker */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Date Range ({filter.startDate.slice(5)} to {filter.endDate.slice(5)})
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              min="2026-09-01"
              max="2026-09-29"
              value={filter.startDate}
              onChange={(e) => setFilter((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-1/2 px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              min="2026-09-01"
              max="2026-09-29"
              value={filter.endDate}
              onChange={(e) => setFilter((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-1/2 px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* City Filter Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            City Filter ({filter.selectedCities.length === 0 ? 'All 24 Cities' : `${filter.selectedCities.length} Selected`})
          </label>
          <button
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300"
          >
            <span className="truncate">
              {filter.selectedCities.length === 0
                ? 'All Cities'
                : filter.selectedCities.map((c) => c.toUpperCase()).join(', ')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {cityDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between px-1 py-1 mb-1 text-[11px]">
                <button
                  onClick={() => setFilter((p) => ({ ...p, selectedCities: [] }))}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setFilter((p) => ({ ...p, selectedCities: availableCities }))}
                  className="text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredCities.map((city) => {
                  const checked = filter.selectedCities.includes(city);
                  return (
                    <label
                      key={city}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer text-xs capitalize text-slate-700 dark:text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCity(city)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="truncate">{city}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                <button
                  onClick={() => setCityDropdownOpen(false)}
                  className="w-full py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Day of Week Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Day of Week
          </label>
          <select
            value={filter.dayOfWeek}
            onChange={(e) => setFilter((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {daysOfWeek.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Days' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save Preset Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Save Filter Preset to Firebase</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Give this filter setup a recognizable name (e.g., &quot;Zero Sales Outliers&quot;).
            </p>
            <input
              type="text"
              placeholder="e.g. Low sales high traffic"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {saveStatus && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 font-medium">{saveStatus}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
