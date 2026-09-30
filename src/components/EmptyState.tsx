import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, PlusCircle, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { parseExcelOrCsvFile, ParseResult } from '../utils/excelParser';
import { SalesRecord } from '../data/initialData';

interface EmptyStateProps {
  onGoToUpload: () => void;
  onLoadSampleData: () => void;
  onOpenAddModal: () => void;
  onLoadedRecords?: (records: SalesRecord[], mode: 'replace' | 'merge') => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onGoToUpload,
  onLoadSampleData,
  onOpenAddModal,
  onLoadedRecords,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await parseExcelOrCsvFile(file);
      if (onLoadedRecords) {
        onLoadedRecords(res.records, 'replace');
      } else {
        onGoToUpload();
      }
    } catch (err: any) {
      console.error('File parsing error in EmptyState:', err);
      setErrorMsg(err.message || 'Unable to parse spreadsheet. Please ensure it has valid columns.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProcessFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border-2 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-dashed border-slate-200 dark:border-slate-800 shadow-sm'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-5 shadow-sm">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          ) : (
            <FileSpreadsheet className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {isLoading ? 'Processing Your Data Sheet...' : 'Ready for Your Sales & Ads Data'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
          {dragActive
            ? 'Drop your Excel spreadsheet here to immediately populate the dashboard!'
            : 'Drop your Excel spreadsheet (.xlsx, .xls, .csv) right here, or click below to upload. Trrop supports any column naming and date formats automatically.'}
        </p>

        {errorMsg && (
          <div className="mb-5 p-3.5 max-w-md mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isLoading ? 'Reading File...' : 'Upload Excel Sheet (.xlsx / .csv)'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-500" />
            <span>Add Record Manually</span>
          </button>

          <button
            onClick={onLoadSampleData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Load Sample Demo Data</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Flexible Columns
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Matches Brand, Date, City, GMV, Orders, Impressions, NTB Buyers in any header style.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Auto Date Sync
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Adapts to DD/MM/YYYY, ISO dates, and Excel timestamps without cutting off records.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Executive PDF Report
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Export professional multi-page branded PDF reports with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
