import type { RTSDataRow } from './rts/types';
import type { ScorecardRow } from './scorecard/types';
import { toISOWeek } from './rts/helpers';

export interface PieDataItem {
  name: string;
  value: number;
}

export interface BarChartDataItem {
  date: string;
  counts: Record<string, number>;
  total: number;
}

export interface EmployeeRow {
  name: string;
  count: number;
  percentage: number;
  oodtCount: number;
  packagesPct: number;
}

export function getRTSDistribution(data: RTSDataRow[]): PieDataItem[] {
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.rtsCode, (counts.get(row.rtsCode) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getUniqueEmployees(data: RTSDataRow[]): string[] {
  const employees = new Set<string>();
  for (const row of data) {
    employees.add(row.deliveryAssociate.trim());
  }
  return Array.from(employees).sort();
}

export function getUniqueRTSCodes(data: RTSDataRow[]): string[] {
  const codes = new Set<string>();
  for (const row of data) {
    codes.add(row.rtsCode);
  }
  return Array.from(codes).sort();
}

export function getBarChartData(data: RTSDataRow[]): BarChartDataItem[] {
  const dateCounts = new Map<string, { counts: Record<string, number>; total: number }>();

  for (const row of data) {
    if (!row.normalizedDate) continue;
    const y = String(row.normalizedDate.getFullYear()).padStart(4, '0');
    const m = String(row.normalizedDate.getMonth() + 1).padStart(2, '0');
    const d = String(row.normalizedDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const existing = dateCounts.get(dateStr) || { counts: {}, total: 0 };
    
    const code = row.rtsCode;
    existing.counts[code] = (existing.counts[code] || 0) + 1;
    existing.total += 1;
    
    dateCounts.set(dateStr, existing);
  }

  return Array.from(dateCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { counts, total }]) => ({ date, counts, total }));
}

export function getEmployeeSummary(data: RTSDataRow[], totalPackages: number): EmployeeRow[] {
  const empData = new Map<string, { count: number; oodtCount: number }>();
  const total = data.length;

  for (const row of data) {
    const name = row.deliveryAssociate.trim();
    const existing = empData.get(name) || { count: 0, oodtCount: 0 };
    existing.count += 1;
    if (row.rtsCode === 'OUT OF DRIVING TIME') {
      existing.oodtCount += 1;
    }
    empData.set(name, existing);
  }

  return Array.from(empData.entries())
    .map(([name, { count, oodtCount }]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      oodtCount,
      packagesPct: totalPackages > 0 ? (count / totalPackages) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTotalPackagesForDateRange(filteredData: RTSDataRow[], scorecardRows: ScorecardRow[]): number {
  const weeks = new Set<string>();
  for (const row of filteredData) {
    if (row.normalizedDate) {
      weeks.add(toISOWeek(row.normalizedDate));
    }
  }
  if (weeks.size === 0) return 0;

  let total = 0;
  for (const row of scorecardRows) {
    if (weeks.has(row.week)) {
      total += row.packagesDelivered;
    }
  }
  return total;
}

export function formatPercent(value: number): string {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const firstSig = Math.max(0, -Math.floor(Math.log10(abs)) + 1);
  const decimals = Math.min(6, Math.max(1, firstSig + 1));
  return parseFloat(value.toFixed(decimals)).toString();
}
