import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesRecord } from '../data/initialData';
import { DailySummary, CitySummary, BrandSummary } from '../types';
import { formatCurrency, formatFullCurrency, formatNumber, formatDateWithDay } from './formatters';

export interface PdfReportOptions {
  reportTitle?: string;
  preparedFor?: string;
  includeAnomalyAudit?: boolean;
  includeCityBreakdown?: boolean;
  includeDailyMatrix?: boolean;
}

export function generatePdfReport(
  records: SalesRecord[],
  dailySummaries: DailySummary[],
  citySummaries: CitySummary[],
  brandSummaries: BrandSummary[],
  options: PdfReportOptions = {}
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const title = options.reportTitle || 'E-Commerce Sales & Ads Performance Audit';
  const preparedFor = options.preparedFor || 'Brand Growth & Marketing Team';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // KPI Calculations
  const totalGmv = records.reduce((s, r) => s + r.gmv, 0);
  const totalOrders = records.reduce((s, r) => s + r.orders, 0);
  const totalImpressions = records.reduce((s, r) => s + r.impressions, 0);
  const totalNtb = records.reduce((s, r) => s + r.ntbBuyers, 0);
  const aov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;
  const convRate = totalImpressions > 0 ? ((totalOrders / totalImpressions) * 100).toFixed(2) : '0';
  const rpm = totalImpressions > 0 ? ((totalGmv / totalImpressions) * 1000).toFixed(1) : '0';

  const zeroSalesRecords = records.filter((r) => r.salesTier === 'zero');
  const wastedImpressions = zeroSalesRecords.reduce((s, r) => s + r.impressions, 0);
  const highSpikeRecords = records.filter((r) => r.salesTier === 'high');

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line
  doc.setFillColor(99, 102, 241); // Indigo-500
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Trrop', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text('E-Commerce Brand, Sales & Ads Analytics Platform', 14, 22);

  // Document metadata on right side
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${currentDate}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Total Records: ${records.length} rows`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Target: ${preparedFor}`, pageWidth - 14, 25, { align: 'right' });

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Comprehensive executive audit of sales revenue, ad impressions, conversion rates, and anomalies.', 14, 54);

  // Executive KPI Summary Grid (4 Boxes)
  const boxY = 59;
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 22;

  // Box 1: Gross Sales
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL GMV (SALES)', 18, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalGmv), 18, boxY + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`AOV: ₹${aov.toLocaleString()}`, 18, boxY + 19);

  // Box 2: Total Orders & NTB
  const box2X = 14 + boxWidth + 3;
  doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ORDERS (NTB)', box2X + 4, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(formatNumber(totalOrders), box2X + 4, boxY + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`NTB: ${formatNumber(totalNtb)} buyers`, box2X + 4, boxY + 19);

  // Box 3: Impressions & Conv.
  const box3X = box2X + boxWidth + 3;
  doc.roundedRect(box3X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AD IMPRESSIONS', box3X + 4, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text(formatNumber(totalImpressions), box3X + 4, boxY + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Conv: ${convRate}% (RPM ₹${rpm})`, box3X + 4, boxY + 19);

  // Box 4: Zero Sales & Leaks
  const box4X = box3X + boxWidth + 3;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(box4X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text('ZERO-SALES DAYS', box4X + 4, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`${zeroSalesRecords.length}`, box4X + 4, boxY + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 18, 57);
  doc.text(`Wasted Imp: ${formatNumber(wastedImpressions)}`, box4X + 4, boxY + 19);

  let currentY = boxY + boxHeight + 8;

  // SECTION 1: Brand Portfolio Overview
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Brand Metrics Comparison', 14, currentY);
  currentY += 4;

  const brandRows = brandSummaries.map((b) => [
    b.brand.toUpperCase(),
    formatCurrency(b.totalGmv),
    formatNumber(b.totalOrders),
    `₹${b.aov.toLocaleString()}`,
    formatNumber(b.totalNtb),
    formatNumber(b.totalImpressions),
    `${b.conversionRate}%`,
    `${b.recordsCount}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Brand', 'Gross GMV', 'Orders', 'AOV', 'NTB Buyers', 'Impressions', 'Conv. Rate', 'Records']],
    body: brandRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 2: Anomaly & Zero/Low Sales Audit (if requested)
  if (options.includeAnomalyAudit !== false) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Anomaly Audit: Zero-Sales & High-Traffic Leaks', 14, currentY);
    currentY += 3;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Identified ${zeroSalesRecords.length} records where ads ran but generated ₹0 sales (${formatNumber(wastedImpressions)} impressions).`,
      14,
      currentY
    );
    currentY += 3;

    // Zero sales city grouping
    const zeroByCity: { [city: string]: { count: number; impressions: number } } = {};
    zeroSalesRecords.forEach((r) => {
      if (!zeroByCity[r.city]) zeroByCity[r.city] = { count: 0, impressions: 0 };
      zeroByCity[r.city].count += 1;
      zeroByCity[r.city].impressions += r.impressions;
    });

    const topZeroCitiesRows = Object.entries(zeroByCity)
      .map(([city, data]) => [
        city.toUpperCase(),
        `${data.count} days`,
        formatNumber(data.impressions),
        '₹0',
        'Zero conversion / Marketing Leak',
      ])
      .sort((a, b) => Number(b[2].replace(/,/g, '')) - Number(a[2].replace(/,/g, '')))
      .slice(0, 8);

    autoTable(doc, {
      startY: currentY,
      head: [['City / Territory', 'Zero-Sales Days', 'Wasted Impressions', 'Revenue (GMV)', 'Audit Assessment']],
      body: topZeroCitiesRows,
      theme: 'grid',
      headStyles: {
        fillColor: [225, 29, 72],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 3: Top Cities Market Share Breakdown
  if (options.includeCityBreakdown !== false) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. Top Territory Performance & Market Share', 14, currentY);
    currentY += 4;

    const topCitiesRows = citySummaries.slice(0, 10).map((c, idx) => [
      `#${idx + 1} ${c.city.toUpperCase()}`,
      formatCurrency(c.totalGmv),
      formatNumber(c.totalOrders),
      formatNumber(c.totalNtb),
      formatNumber(c.totalImpressions),
      `${c.conversionRate}%`,
      `₹${c.rpm.toLocaleString()}`,
      `${c.zeroSalesCount} days`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Territory', 'Gross GMV', 'Orders', 'NTB Buyers', 'Impressions', 'Conv. %', 'RPM', 'Zero Days']],
      body: topCitiesRows,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 4: Daily Performance Matrix (Date-by-Date)
  if (options.includeDailyMatrix !== false && dailySummaries.length > 0) {
    doc.addPage();
    currentY = 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. Daily Date-wise Performance Timeline', 14, currentY);
    currentY += 4;

    const dailyRows = dailySummaries.map((d) => [
      d.date,
      d.dayOfWeek.slice(0, 3),
      formatCurrency(d.totalGmv),
      `${d.totalOrders} (${d.totalNtb})`,
      formatNumber(d.totalImpressions),
      `${d.conversionRate}%`,
      `${d.topCity.toUpperCase()} (${formatCurrency(d.topCityGmv)})`,
      d.totalGmv >= 35000 ? 'Peak Spike' : d.totalGmv === 0 ? 'Zero Sales' : 'Normal',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Day', 'GMV (Sales)', 'Orders (NTB)', 'Impressions', 'Conv. %', 'Top City', 'Status']],
      body: dailyRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        7: { halign: 'center' },
      },
    });
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Trrop Analytics Platform • Page ${i} of ${totalPages} • Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Trrop_Sales_Ads_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
