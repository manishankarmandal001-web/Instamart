import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SalesRecord } from '../data/initialData';
import { formatCurrency, formatNumber, formatDateWithDay } from '../utils/formatters';
import { generatePdfReport, PdfReportOptions } from '../utils/pdfGenerator';
import { DailySummary, CitySummary, BrandSummary } from '../types';
import { useAuth } from '../firebase/AuthContext';
import { addCustomRecord } from '../firebase/firestoreService';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  TrendingUp,
  Eye,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

interface ExcelUploadTabProps {
  currentRecords: SalesRecord[];
  dailySummaries: DailySummary[];
  citySummaries: CitySummary[];
  brandSummaries: BrandSummary[];
  onLoadUploadedRecords: (records: SalesRecord[], mode: 'replace' | 'merge') => void;
}

export const ExcelUploadTab: React.FC<ExcelUploadTabProps> = ({
  currentRecords,
  dailySummaries,
  citySummaries,
  brandSummaries,
  onLoadUploadedRecords,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedRecords, setUploadedRecords] = useState<SalesRecord[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncSuccess, setFirebaseSyncSuccess] = useState<string | null>(null);

  // PDF report options
  const [reportTitle, setReportTitle] = useState('E-Commerce Sales & Ads Performance Audit');
  const [preparedFor, setPreparedFor] = useState('Executive & Marketing Team');
  const [includeAnomalyAudit, setIncludeAnomalyAudit] = useState(true);
  const [includeCityBreakdown, setIncludeCityBreakdown] = useState(true);
  const [includeDailyMatrix, setIncludeDailyMatrix] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Preview table pagination & search
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 8;

  // Flexible column resolver helper
  const findValue = (row: any, candidates: string[]): any => {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
      for (const cand of candidates) {
        if (normalizedKey === cand.toLowerCase().replace(/[\s_-]+/g, '')) {
          return row[key];
        }
      }
    }
    return undefined;
  };

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setUploadError('The uploaded file is empty or has no recognizable data rows.');
          return;
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const parsedRecords: SalesRecord[] = [];

        jsonRows.forEach((row, idx) => {
          // Resolve fields flexibly
          const rawBrand = findValue(row, ['brand_name', 'brand', 'brandname']) || 'nafa';
          let rawDate = findValue(row, ['date', 'day', 'order_date']) || '2026-09-01';
          const rawCity = findValue(row, ['city', 'location', 'territory', 'place']) || 'general';
          const rawNtb = Number(findValue(row, ['ntb_buyers', 'ntb', 'new_buyers', 'newbuyers'])) || 0;
          const rawImpressions = Number(findValue(row, ['brand_impressions', 'impressions', 'ad_impressions', 'views'])) || 0;
          const rawGmv = Number(findValue(row, ['brand_gmv', 'gmv', 'sales', 'revenue', 'amount'])) || 0;
          const rawOrders = Number(findValue(row, ['brand_orders', 'orders', 'units', 'total_orders'])) || 0;

          // Normalize Date if it is Excel serial date number
          if (typeof rawDate === 'number') {
            const excelDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            rawDate = excelDate.toISOString().slice(0, 10);
          } else {
            rawDate = String(rawDate).trim().slice(0, 10);
          }

          const dt = new Date(rawDate + 'T00:00:00Z');
          const dayOfWeek = isNaN(dt.getTime()) ? 'Monday' : dayNames[dt.getUTCDay()];

          let salesTier: 'zero' | 'low' | 'medium' | 'high' = 'zero';
          if (rawGmv >= 10000) salesTier = 'high';
          else if (rawGmv >= 1000) salesTier = 'medium';
          else if (rawGmv > 0) salesTier = 'low';

          parsedRecords.push({
            id: `upload_${Date.now()}_${idx}`,
            brand: String(rawBrand).trim().toLowerCase(),
            date: rawDate,
            city: String(rawCity).trim().toLowerCase(),
            ntbBuyers: rawNtb,
            impressions: rawImpressions,
            gmv: rawGmv,
            orders: rawOrders,
            aov: rawOrders > 0 ? Math.round(rawGmv / rawOrders) : 0,
            conversionRate: rawImpressions > 0 ? Number(((rawOrders / rawImpressions) * 100).toFixed(2)) : 0,
            rpm: rawImpressions > 0 ? Number(((rawGmv / rawImpressions) * 1000).toFixed(1)) : 0,
            salesTier,
            dayOfWeek,
            isTrafficLeak: rawImpressions >= 150 && rawGmv === 0,
            isSpike: rawGmv >= 15000,
          });
        });

        if (parsedRecords.length === 0) {
          setUploadError('Could not parse any valid sales rows from this file.');
          return;
        }

        setUploadedRecords(parsedRecords);
        setUploadSuccess(`Successfully parsed ${parsedRecords.length} records from "${file.name}"!`);
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setUploadError(`Failed to parse file: ${err.message || 'Invalid Excel format'}`);
      }
    };

    reader.readAsBinaryString(file);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        BRAND_NAME: 'nafa',
        DATE: '2026-09-12',
        CITY: 'bangalore',
        NTB_BUYERS: 32,
        BRAND_IMPRESSIONS: 3987,
        BRAND_GMV: 41466,
        BRAND_ORDERS: 33,
      },
      {
        BRAND_NAME: 'averx',
        DATE: '2026-09-12',
        CITY: 'bangalore',
        NTB_BUYERS: 14,
        BRAND_IMPRESSIONS: 3605,
        BRAND_GMV: 7035,
        BRAND_ORDERS: 15,
      },
      {
        BRAND_NAME: 'nafa',
        DATE: '2026-09-12',
        CITY: 'delhi',
        NTB_BUYERS: 0,
        BRAND_IMPRESSIONS: 411,
        BRAND_GMV: 0,
        BRAND_ORDERS: 0,
      },
      {
        BRAND_NAME: 'nafa',
        DATE: '2026-09-12',
        CITY: 'mumbai',
        NTB_BUYERS: 1,
        BRAND_IMPRESSIONS: 248,
        BRAND_GMV: 999,
        BRAND_ORDERS: 1,
      },
      {
        BRAND_NAME: 'nafa',
        DATE: '2026-09-12',
        CITY: 'kolkata',
        NTB_BUYERS: 2,
        BRAND_IMPRESSIONS: 141,
        BRAND_GMV: 1998,
        BRAND_ORDERS: 2,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');
    XLSX.writeFile(workbook, 'trrop_sales_data_template.xlsx');
  };

  // Sync uploaded records to Firebase
  const handleSyncToFirebase = async () => {
    if (!user) {
      alert('Please sign in with Google to sync records to your personal Firebase database.');
      return;
    }
    if (uploadedRecords.length === 0) return;

    setIsSyncingFirebase(true);
    setFirebaseSyncSuccess(null);
    try {
      // Sync up to first 50 records in batch to respect quotas
      const recordsToSync = uploadedRecords.slice(0, 50);
      for (const rec of recordsToSync) {
        await addCustomRecord(user.uid, {
          brand: rec.brand,
          date: rec.date,
          city: rec.city,
          ntbBuyers: rec.ntbBuyers,
          impressions: rec.impressions,
          gmv: rec.gmv,
          orders: rec.orders,
        });
      }
      setFirebaseSyncSuccess(`Synced ${recordsToSync.length} records to your cloud Firestore database!`);
    } catch (err: any) {
      console.error(err);
      alert('Error syncing to Firebase: ' + err.message);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Generate & Download PDF Report
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      // If user has uploaded data, generate report from uploaded or from active dataset
      const recordsForReport = uploadedRecords.length > 0 ? uploadedRecords : currentRecords;
      generatePdfReport(recordsForReport, dailySummaries, citySummaries, brandSummaries, {
        reportTitle,
        preparedFor,
        includeAnomalyAudit,
        includeCityBreakdown,
        includeDailyMatrix,
      });
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Computed metrics for uploaded data
  const upGmv = uploadedRecords.reduce((s, r) => s + r.gmv, 0);
  const upOrders = uploadedRecords.reduce((s, r) => s + r.orders, 0);
  const upImpressions = uploadedRecords.reduce((s, r) => s + r.impressions, 0);
  const upNtb = uploadedRecords.reduce((s, r) => s + r.ntbBuyers, 0);
  const upZeroCount = uploadedRecords.filter((r) => r.salesTier === 'zero').length;
  const upSpikesCount = uploadedRecords.filter((r) => r.isSpike).length;

  const filteredPreview = uploadedRecords.filter(
    (r) =>
      r.city.includes(previewSearch.toLowerCase()) ||
      r.brand.includes(previewSearch.toLowerCase()) ||
      r.date.includes(previewSearch)
  );
  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const paginatedPreview = filteredPreview.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Excel Data Importer & PDF Generator
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Upload Sales Excel & Generate PDF Reports
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1">
              Upload your custom e-commerce spreadsheet (.xlsx, .xls, .csv) for instant analysis, sync to Firebase, and download executive PDF reports.
            </p>
          </div>

          <button
            onClick={handleDownloadSampleTemplate}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 shadow-md transition-all self-start md:self-center"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Sample Excel</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Area on Left, PDF Report Configurator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Zone (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Upload Spreadsheet (.xlsx / .csv)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Supports standard columns: Brand, Date, City, NTB Buyers, Impressions, GMV, and Orders.
          </p>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Drag & Drop your Excel file here, or <span className="text-emerald-600 dark:text-emerald-400 underline">Browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv files up to 20MB
            </p>

            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            )}
          </div>

          {/* Alerts */}
          {uploadError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            </div>
          )}

          {firebaseSyncSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{firebaseSyncSuccess}</span>
            </div>
          )}

          {/* Action buttons after file is parsed */}
          {uploadedRecords.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoadUploadedRecords(uploadedRecords, 'replace')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  Analyze in Trrop (Replace)
                </button>
                <button
                  onClick={() => onLoadUploadedRecords(uploadedRecords, 'merge')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Merge with Current Data
                </button>
              </div>

              {user ? (
                <button
                  onClick={handleSyncToFirebase}
                  disabled={isSyncingFirebase}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isSyncingFirebase ? 'Syncing...' : 'Sync to Firebase'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Sign in to sync to Firebase</span>
              )}
            </div>
          )}
        </div>

        {/* PDF Report Generator Box (5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Download PDF Analysis Report</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Export high-resolution audit reports with KPI boxes, anomaly tables, and date matrix.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Prepared For / Audience
                </label>
                <input
                  type="text"
                  value={preparedFor}
                  onChange={(e) => setPreparedFor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sections to Include:
                </span>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnomalyAudit}
                    onChange={(e) => setIncludeAnomalyAudit(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Section 2: Zero-Sales & Traffic Leaks Audit</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCityBreakdown}
                    onChange={(e) => setIncludeCityBreakdown(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Section 3: Top Territory Performance</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDailyMatrix}
                    onChange={(e) => setIncludeDailyMatrix(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Section 4: Daily Date-wise Performance Timeline</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Executive PDF Report'}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Exports A4 formatted PDF with vector styling and branded Trrop layout
            </p>
          </div>
        </div>
      </div>

      {/* Mini-Analysis & Table Preview for Uploaded Spreadsheet */}
      {uploadedRecords.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Uploaded Data Intelligence Overview ({uploadedRecords.length} Rows)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant analytics computed from your uploaded file &quot;{fileName}&quot;
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search uploaded rows..."
                value={previewSearch}
                onChange={(e) => {
                  setPreviewSearch(e.target.value);
                  setPreviewPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Quick Upload Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Sales (GMV)</span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(upGmv)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Orders</span>
              <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatNumber(upOrders)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">NTB Buyers</span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">{formatNumber(upNtb)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ad Impressions</span>
              <strong className="text-sm font-bold text-sky-600 dark:text-sky-400 font-mono">{formatNumber(upImpressions)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold block">Zero Sales Days</span>
              <strong className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">{upZeroCount}</strong>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold block">Sales Spikes</span>
              <strong className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{upSpikesCount}</strong>
            </div>
          </div>

          {/* Uploaded Records Preview Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-right">Impressions</th>
                  <th className="py-2.5 px-3 text-right">Gross GMV</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">NTB</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPreview.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-mono text-[11px]">
                    <td className="py-2 px-3 uppercase font-bold text-slate-800 dark:text-slate-200">{rec.brand}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{rec.date}</td>
                    <td className="py-2 px-3 capitalize font-semibold text-slate-800 dark:text-slate-200">{rec.city}</td>
                    <td className="py-2 px-3 text-right text-sky-600 dark:text-sky-400">{formatNumber(rec.impressions)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {rec.gmv > 0 ? `₹${rec.gmv.toLocaleString()}` : '₹0'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{rec.orders}</td>
                    <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">{rec.ntbBuyers}</td>
                    <td className="py-2 px-3 text-center">
                      {rec.gmv === 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                          Zero
                        </span>
                      ) : rec.gmv >= 10000 ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          Spike
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing {(previewPage - 1) * pageSize + 1} - {Math.min(previewPage * pageSize, filteredPreview.length)} of{' '}
              {filteredPreview.length} rows
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={previewPage === 1}
                onClick={() => setPreviewPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 font-mono">
                {previewPage} / {totalPages}
              </span>
              <button
                disabled={previewPage === totalPages}
                onClick={() => setPreviewPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
