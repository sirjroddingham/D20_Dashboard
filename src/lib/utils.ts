import type { RTSDataRow } from '../types';

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

export function getEmployeeSummary(data: RTSDataRow[]): EmployeeRow[] {
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
    }))
    .sort((a, b) => b.count - a.count);
}
