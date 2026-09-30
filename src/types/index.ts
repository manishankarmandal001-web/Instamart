import { SalesRecord } from '../data/initialData';

export type PerformanceFilter = 'all' | 'zero' | 'low' | 'medium' | 'high' | 'traffic_leak' | 'spikes';

export interface FilterState {
  brand: string;
  startDate: string;
  endDate: string;
  selectedCities: string[];
  performance: PerformanceFilter;
  dayOfWeek: string;
  searchTerm: string;
}

export interface DailySummary {
  date: string;
  dayOfWeek: string;
  totalGmv: number;
  totalOrders: number;
  totalImpressions: number;
  totalNtb: number;
  aov: number;
  conversionRate: number;
  rpm: number;
  recordsCount: number;
  zeroSalesCount: number;
  topCity: string;
  topCityGmv: number;
  records: SalesRecord[];
}

export interface CitySummary {
  city: string;
  totalGmv: number;
  totalOrders: number;
  totalImpressions: number;
  totalNtb: number;
  conversionRate: number;
  rpm: number;
  recordsCount: number;
  zeroSalesCount: number;
}

export interface BrandSummary {
  brand: string;
  totalGmv: number;
  totalOrders: number;
  totalImpressions: number;
  totalNtb: number;
  aov: number;
  conversionRate: number;
  recordsCount: number;
}
