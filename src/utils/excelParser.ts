import * as XLSX from 'xlsx';
import { SalesRecord } from '../data/initialData';

export interface SheetParseResult {
  sheetName: string;
  records: SalesRecord[];
  totalRows: number;
  detectedColumns: Record<string, string>;
  minDate: string;
  maxDate: string;
  isAdsSheet: boolean;
  totalImpressions: number;
  totalGmv: number;
  totalOrders: number;
}

export interface ParseResult {
  records: SalesRecord[];
  sheetName: string;
  totalRows: number;
  detectedColumns: Record<string, string>;
  minDate: string;
  maxDate: string;
  sheets: SheetParseResult[];
  adsSheetFound: boolean;
}

// Clean and extract numeric values from any formatted string ($1,500.50, ₹ 41,466, 12.5%, etc.)
export const parseNumericValue = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'boolean') return val ? 1 : 0;

  const str = String(val)
    .replace(/[₹$,€£৳\s]/g, '')
    .replace(/,/g, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Robust date normalizer supporting Excel serial dates, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
export const normalizeToISODate = (val: any): string => {
  const fallback = new Date().toISOString().slice(0, 10);
  if (val === null || val === undefined || val === '') return fallback;

  // If already a JavaScript Date object (from XLSX cellDates: true)
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // If Excel serial number (e.g. 45548)
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().slice(0, 10);
    }
  }

  const str = String(val).trim();

  // Pattern: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
    const parts = str.split(/[-/.]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].slice(0, 2).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)) {
    const parts = str.split(/[-/.]/);
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const y = parts[2].slice(0, 4);

    let d: string;
    let m: string;

    if (p1 > 12 && p2 <= 12) {
      d = String(p1).padStart(2, '0');
      m = String(p2).padStart(2, '0');
    } else if (p2 > 12 && p1 <= 12) {
      m = String(p1).padStart(2, '0');
      d = String(p2).padStart(2, '0');
    } else {
      d = String(p1).padStart(2, '0');
      m = String(p2).padStart(2, '0');
    }
    return `${y}-${m}-${d}`;
  }

  // General Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return fallback;
};

// Flexible column finder with exact aliases, fuzzy keywords, and forbidden exclusion keywords
const resolveColumnValue = (
  row: Record<string, any>,
  exactAliases: string[],
  fuzzyKeywords: string[],
  excludeKeywords: string[] = []
): { value: any; matchedHeader: string } => {
  const keys = Object.keys(row);

  // 1. Exact normalized match
  for (const key of keys) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const alias of exactAliases) {
      if (norm === alias.toLowerCase().replace(/[^a-z0-9]/g, '')) {
        return { value: row[key], matchedHeader: key };
      }
    }
  }

  // 2. Fuzzy keyword check (ensuring excluded keywords are NOT present)
  for (const key of keys) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Skip if contains excluded keyword
    const hasForbidden = excludeKeywords.some((ex) => norm.includes(ex.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (hasForbidden) continue;

    for (const kw of fuzzyKeywords) {
      if (norm.includes(kw.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
        return { value: row[key], matchedHeader: key };
      }
    }
  }

  return { value: undefined, matchedHeader: '' };
};

// Parse a single worksheet into SalesRecord array
function parseWorksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  sheetIndex: number
): SheetParseResult | null {
  if (!worksheet || !worksheet['!ref']) return null;

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) return null;

  // Find header row (handles title rows or banner rows)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const stringCount = row.filter((c) => typeof c === 'string' && c.trim().length > 0).length;
    const joined = row.join(' ').toLowerCase();

    // Check if row has column keywords (including ads and impression!)
    if (
      (joined.includes('sales') ||
        joined.includes('gmv') ||
        joined.includes('brand') ||
        joined.includes('city') ||
        joined.includes('date') ||
        joined.includes('order') ||
        joined.includes('impression') ||
        joined.includes('impr') ||
        joined.includes('ad')) &&
      stringCount >= 2
    ) {
      headerRowIndex = i;
      break;
    }
    if (stringCount >= 3 && headerRowIndex === 0) {
      headerRowIndex = i;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h: any, idx: number) =>
    h ? String(h).trim() : `Col_${idx + 1}`
  );

  const dataRows: Record<string, any>[] = [];
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const hasData = row.some((c) => c !== '' && c !== null && c !== undefined);
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    dataRows.push(rowObj);
  }

  if (dataRows.length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const parsedRecords: SalesRecord[] = [];
  const detectedColumns: Record<string, string> = {};

  // Exact aliases & fuzzy keywords
  // 1. BRAND IMPRESSION (Must be checked first and explicitly prioritized!)
  const impressionsAliases = [
    'brand_impression',
    'brand_impressions',
    'brandimpression',
    'brandimpressions',
    'ad_impression',
    'ad_impressions',
    'adimpression',
    'adimpressions',
    'impression',
    'impressions',
    'total_impressions',
    'totalimpressions',
    'campaign_impressions',
    'views',
    'ad_views',
    'adviews',
    'reach',
    'impr',
    'imprs',
    'impr.',
    'clicks',
    'ad_clicks',
  ];
  const impressionsKeywords = ['impression', 'impr', 'view', 'reach'];

  // 2. BRAND NAME (Excludes impression, gmv, sales, spend, order so Brand Impression is NEVER matched as brand!)
  const brandAliases = ['brand_name', 'brand', 'brandname', 'store_name', 'store', 'seller_name', 'seller', 'label', 'account', 'client'];
  const brandKeywords = ['brand', 'store', 'seller'];
  const brandExclude = ['impression', 'impr', 'gmv', 'sales', 'order', 'spend', 'revenue', 'cost', 'click', 'view'];

  // 3. DATE
  const dateAliases = ['date', 'day', 'order_date', 'sales_date', 'ad_date', 'transaction_date', 'created_at', 'timestamp', 'dt'];
  const dateKeywords = ['date', 'day', 'time'];

  // 4. CITY
  const cityAliases = ['city', 'location', 'territory', 'place', 'town', 'region', 'market', 'state', 'area', 'destination', 'district', 'hub'];
  const cityKeywords = ['city', 'location', 'territory', 'region', 'market', 'town'];

  // 5. GMV / SALES / SPEND
  const gmvAliases = [
    'brand_gmv',
    'gmv',
    'sales',
    'revenue',
    'amount',
    'total_sales',
    'gross_sales',
    'gross_gmv',
    'turnover',
    'sale_amount',
    'ordervalue',
    'value',
    'total_amount',
    'ad_spend',
    'spend',
    'cost',
    'price',
  ];
  const gmvKeywords = ['gmv', 'sales', 'revenue', 'amount', 'turnover', 'spend'];
  const gmvExclude = ['impression', 'impr', 'order', 'unit', 'qty', 'rate', 'percentage'];

  // 6. ORDERS / CONVERSIONS
  const ordersAliases = [
    'brand_orders',
    'orders',
    'total_orders',
    'order_count',
    'units',
    'units_sold',
    'qty',
    'quantity',
    'items',
    'conversions',
    'sales_count',
    'transactions',
  ];
  const ordersKeywords = ['order', 'unit', 'qty', 'quantity', 'item', 'conversion'];
  const ordersExclude = ['impression', 'impr', 'gmv', 'sales', 'revenue', 'spend'];

  // 7. NTB BUYERS
  const ntbAliases = [
    'ntb_buyers',
    'ntb',
    'new_buyers',
    'newbuyers',
    'new_customers',
    'ntb_customers',
    'first_time_buyers',
    'first_buyers',
    'ntb_orders',
    'new_users',
  ];
  const ntbKeywords = ['ntb', 'newbuyer', 'newcustomer'];

  dataRows.forEach((row, idx) => {
    // Resolve impressions first to ensure Brand Impression is recognized immediately
    const impressionsMatch = resolveColumnValue(row, impressionsAliases, impressionsKeywords);
    const brandMatch = resolveColumnValue(row, brandAliases, brandKeywords, brandExclude);
    const dateMatch = resolveColumnValue(row, dateAliases, dateKeywords);
    const cityMatch = resolveColumnValue(row, cityAliases, cityKeywords);
    const gmvMatch = resolveColumnValue(row, gmvAliases, gmvKeywords, gmvExclude);
    const ordersMatch = resolveColumnValue(row, ordersAliases, ordersKeywords, ordersExclude);
    const ntbMatch = resolveColumnValue(row, ntbAliases, ntbKeywords);

    if (idx === 0) {
      if (impressionsMatch.matchedHeader) detectedColumns['Brand Impressions'] = impressionsMatch.matchedHeader;
      if (brandMatch.matchedHeader) detectedColumns['Brand'] = brandMatch.matchedHeader;
      if (dateMatch.matchedHeader) detectedColumns['Date'] = dateMatch.matchedHeader;
      if (cityMatch.matchedHeader) detectedColumns['City'] = cityMatch.matchedHeader;
      if (gmvMatch.matchedHeader) detectedColumns['GMV / Sales'] = gmvMatch.matchedHeader;
      if (ordersMatch.matchedHeader) detectedColumns['Orders'] = ordersMatch.matchedHeader;
      if (ntbMatch.matchedHeader) detectedColumns['NTB Buyers'] = ntbMatch.matchedHeader;
    }

    const rawImpressions = parseNumericValue(impressionsMatch.value);
    const rawBrand = brandMatch.value || 'nafa';
    const rawDate = normalizeToISODate(dateMatch.value);
    const rawCity = cityMatch.value || 'General';
    const rawGmv = parseNumericValue(gmvMatch.value);
    const rawOrders = parseNumericValue(ordersMatch.value);
    const rawNtb = parseNumericValue(ntbMatch.value);

    const dt = new Date(rawDate + 'T00:00:00Z');
    const dayOfWeek = isNaN(dt.getTime()) ? 'Monday' : dayNames[dt.getUTCDay()];

    let salesTier: 'zero' | 'low' | 'medium' | 'high' = 'zero';
    if (rawGmv >= 10000) salesTier = 'high';
    else if (rawGmv >= 1000) salesTier = 'medium';
    else if (rawGmv > 0) salesTier = 'low';

    parsedRecords.push({
      id: `rec_${sheetIndex}_${Date.now()}_${idx}`,
      brand: String(rawBrand).trim().toLowerCase(),
      date: rawDate,
      city: String(rawCity).trim().toLowerCase(),
      ntbBuyers: Math.round(rawNtb),
      impressions: Math.round(rawImpressions),
      gmv: Math.round(rawGmv),
      orders: Math.round(rawOrders),
      aov: rawOrders > 0 ? Math.round(rawGmv / rawOrders) : 0,
      conversionRate: rawImpressions > 0 ? Number(((rawOrders / rawImpressions) * 100).toFixed(2)) : 0,
      rpm: rawImpressions > 0 ? Number(((rawGmv / rawImpressions) * 1000).toFixed(1)) : 0,
      salesTier,
      dayOfWeek,
      isTrafficLeak: rawImpressions >= 150 && rawGmv === 0,
      isSpike: rawGmv >= 15000,
    });
  });

  if (parsedRecords.length === 0) return null;

  const sortedDates = parsedRecords.map((r) => r.date).sort();
  const minDate = sortedDates[0] || '2026-09-01';
  const maxDate = sortedDates[sortedDates.length - 1] || '2026-09-30';

  const totalImpressions = parsedRecords.reduce((s, r) => s + r.impressions, 0);
  const totalGmv = parsedRecords.reduce((s, r) => s + r.gmv, 0);
  const totalOrders = parsedRecords.reduce((s, r) => s + r.orders, 0);

  const lowerName = sheetName.toLowerCase();
  const isAdsSheet =
    lowerName.includes('ad') ||
    lowerName.includes('impression') ||
    lowerName.includes('campaign') ||
    lowerName.includes('marketing') ||
    lowerName.includes('media') ||
    lowerName.includes('traffic');

  return {
    sheetName,
    records: parsedRecords,
    totalRows: parsedRecords.length,
    detectedColumns,
    minDate,
    maxDate,
    isAdsSheet,
    totalImpressions,
    totalGmv,
    totalOrders,
  };
}

export async function parseExcelOrCsvFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The workbook contains no sheets.');
  }

  const parsedSheets: SheetParseResult[] = [];

  // Parse all non-empty sheets in the workbook
  workbook.SheetNames.forEach((sName, sIdx) => {
    const ws = workbook.Sheets[sName];
    const res = parseWorksheet(ws, sName, sIdx);
    if (res) {
      parsedSheets.push(res);
    }
  });

  if (parsedSheets.length === 0) {
    throw new Error('Could not find any readable data rows in any sheet of the spreadsheet.');
  }

  // Check if an "Ads" sheet exists in the workbook
  const adsSheet = parsedSheets.find((s) => s.isAdsSheet);
  const adsSheetFound = !!adsSheet;

  // By default, if an Ads sheet exists and was explicitly asked, or if there's only 1 sheet, use it;
  // If multiple sheets exist (e.g. Sales + Ads), combine their records or default to first
  let primarySheet = parsedSheets[0];

  // If there's an Ads sheet, prioritize making its records available
  let combinedRecords: SalesRecord[] = [];
  if (parsedSheets.length === 1) {
    combinedRecords = parsedSheets[0].records;
    primarySheet = parsedSheets[0];
  } else {
    // If multiple sheets (e.g. Sales + Ads), combine all records so full analytics is powered
    parsedSheets.forEach((s) => {
      combinedRecords.push(...s.records);
    });
  }

  const allDates = combinedRecords.map((r) => r.date).sort();
  const minDate = allDates[0] || '2026-09-01';
  const maxDate = allDates[allDates.length - 1] || '2026-09-30';

  return {
    records: combinedRecords,
    sheetName: parsedSheets.length === 1 ? primarySheet.sheetName : `All Sheets (${parsedSheets.length})`,
    totalRows: combinedRecords.length,
    detectedColumns: primarySheet.detectedColumns,
    minDate,
    maxDate,
    sheets: parsedSheets,
    adsSheetFound,
  };
}
