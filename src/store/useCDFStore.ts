import { useMemo } from 'react';
import { useDataSourceStore } from './useDataSourceStore';
import { useDAPerformanceStore } from './useDAPerformanceStore';
import type { CDFRow } from '../lib/cdf/types';
import { CDF_DEFECT_COLUMNS, CDF_DEFECT_LABELS, CDF_DEFECT_SHORT_LABELS } from '../lib/cdf/types';
import type { CDFDefectColumn } from '../lib/cdf/types';

interface CDFFilterState {
  employee: string;
  categories: string[];
  dateStart: string;
  dateEnd: string;
  search: string;
  impactsDsb: string;
}

interface EmployeeSummary {
  transporterId: string;
  name: string;
  totalDefects: number;
  categories: Record<string, number>;
  trackingIds: string[];
  dpmo: number | null;
  packages: number;
  weeksInRange: number;
}

export function useCDFData() {
  const cdfRows = useDataSourceStore(s => s.cdfRows);
  const cdfLoadedWeeks = useDataSourceStore(s => s.cdfLoadedWeeks);
  const cdfLastUpload = useDataSourceStore(s => s.cdfLastUpload);
  const scorecardRows = useDAPerformanceStore(s => s.rows);

  const mostRecentWeek = cdfLoadedWeeks.length > 0 ? cdfLoadedWeeks[cdfLoadedWeeks.length - 1] : '';

  return {
    cdfRows,
    cdfLoadedWeeks,
    cdfLastUpload,
    mostRecentWeek,
    scorecardRows,
  };
}

export function useFilteredRows(rows: CDFRow[], selectedWeek: string, filters: CDFFilterState): CDFRow[] {
  return useMemo(() => {
    let filtered = rows;

    if (selectedWeek && selectedWeek !== '__all__') {
      filtered = filtered.filter(r => r.week === selectedWeek);
    }

    if (filters.employee) {
      filtered = filtered.filter(r => r.deliveryAssociateName === filters.employee);
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(r =>
        filters.categories.some(c => r.defectCategories.includes(c))
      );
    }

    if (filters.dateStart) {
      const start = new Date(filters.dateStart);
      filtered = filtered.filter(r => {
        if (!r.deliveryDate) return false;
        return new Date(r.deliveryDate) >= start;
      });
    }

    if (filters.dateEnd) {
      const end = new Date(filters.dateEnd);
      end.setDate(end.getDate() + 1);
      filtered = filtered.filter(r => {
        if (!r.deliveryDate) return false;
        return new Date(r.deliveryDate) < end;
      });
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.deliveryAssociateName.toLowerCase().includes(term) ||
        r.trackingId.toLowerCase().includes(term) ||
        (r.deliveryDate || '').toLowerCase().includes(term) ||
        r.feedbackDetails.toLowerCase().includes(term) ||
        r.defectCategories.some(c => CDF_DEFECT_LABELS[c as CDFDefectColumn]?.toLowerCase().includes(term))
      );
    }

    if (filters.impactsDsb && filters.impactsDsb !== 'all') {
      const isImpacts = filters.impactsDsb === 'Y';
      filtered = filtered.filter(r => r.impactsDsb === isImpacts);
    }

    return filtered;
  }, [rows, selectedWeek, filters]);
}

export function useEmployeeSummaries(rows: CDFRow[], scorecardRows: Array<{ transporterId: string; packagesDelivered: number; week: string }>, selectedWeek: string): EmployeeSummary[] {
  return useMemo(() => {
    const scopedRows = rows;

    const pkgMap: Record<string, number> = {};
    const scRows = selectedWeek && selectedWeek !== '__all__'
      ? scorecardRows.filter(sr => sr.week === selectedWeek)
      : scorecardRows;
    scRows.forEach(sr => {
      pkgMap[sr.transporterId] = (pkgMap[sr.transporterId] || 0) + sr.packagesDelivered;
    });

    // Count distinct weeks per transporter from scorecard
    const weekSetMap: Record<string, Set<string>> = {};
    scRows.forEach(sr => {
      if (!weekSetMap[sr.transporterId]) weekSetMap[sr.transporterId] = new Set();
      weekSetMap[sr.transporterId].add(sr.week);
    });

    const empMap = new Map<string, EmployeeSummary>();

    scopedRows.forEach(r => {
      if (!empMap.has(r.deliveryAssociate)) {
        const cats: Record<string, number> = {};
        CDF_DEFECT_COLUMNS.forEach(c => { cats[c] = 0; });
        empMap.set(r.deliveryAssociate, {
          transporterId: r.deliveryAssociate,
          name: r.deliveryAssociateName,
          totalDefects: 0,
          categories: cats,
          trackingIds: [],
          dpmo: null,
          packages: pkgMap[r.deliveryAssociate] || 0,
          weeksInRange: weekSetMap[r.deliveryAssociate]?.size || 0,
        });
      }

      const emp = empMap.get(r.deliveryAssociate)!;
      emp.trackingIds.push(r.trackingId);
      CDF_DEFECT_COLUMNS.forEach(c => {
        const flag = r[c as keyof CDFRow] as boolean;
        if (flag) emp.categories[c]++;
      });
      emp.totalDefects += r.defectCategories.length;
    });

    const summaries = Array.from(empMap.values());

    summaries.forEach(emp => {
      if (emp.packages > 0 && emp.totalDefects > 0) {
        emp.dpmo = Math.round((emp.totalDefects / emp.packages) * 1000000);
      }
    });

    summaries.sort((a, b) => b.totalDefects - a.totalDefects);
    return summaries;
  }, [rows, scorecardRows, selectedWeek]);
}

export function useCategoryTotals(rows: CDFRow[]): Record<string, number> {
  return useMemo(() => {
    const totals: Record<string, number> = {};
    CDF_DEFECT_COLUMNS.forEach(c => { totals[c] = 0; });
    rows.forEach(r => {
      CDF_DEFECT_COLUMNS.forEach(c => {
        if (r[c as keyof CDFRow] as boolean) totals[c]++;
      });
    });
    return totals;
  }, [rows]);
}

export function useDefectFreeEmployees(
  rows: CDFRow[],
  scorecardRows: Array<{ transporterId: string; name: string; packagesDelivered: number; week: string }>,
  selectedWeek: string,
): EmployeeSummary[] {
  return useMemo(() => {
    const scopedRows = selectedWeek && selectedWeek !== '__all__'
      ? rows.filter(r => r.week === selectedWeek)
      : rows;
    const idsWithDefects = new Set(scopedRows.map(r => r.deliveryAssociate));

    const pkgMap: Record<string, number> = {};
    const nameMap: Record<string, string> = {};
    const weekSetMap: Record<string, Set<string>> = {};
    scorecardRows.forEach(sr => {
      pkgMap[sr.transporterId] = (pkgMap[sr.transporterId] || 0) + sr.packagesDelivered;
      nameMap[sr.transporterId] = sr.name;
      if (!weekSetMap[sr.transporterId]) weekSetMap[sr.transporterId] = new Set();
      weekSetMap[sr.transporterId].add(sr.week);
    });

    const cats: Record<string, number> = {};
    CDF_DEFECT_COLUMNS.forEach(c => { cats[c] = 0; });

    const seen = new Set<string>();
    const results: EmployeeSummary[] = [];
    scorecardRows.forEach(sr => {
      if (seen.has(sr.transporterId)) return;
      seen.add(sr.transporterId);
      if (!idsWithDefects.has(sr.transporterId)) {
        results.push({
          transporterId: sr.transporterId,
          name: sr.name,
          totalDefects: 0,
          categories: { ...cats },
          trackingIds: [],
          dpmo: null,
          packages: pkgMap[sr.transporterId] || 0,
          weeksInRange: weekSetMap[sr.transporterId]?.size || 0,
        });
      }
    });

    results.sort((a, b) => b.packages - a.packages);
    return results;
  }, [rows, scorecardRows, selectedWeek]);
}

export function useUniqueEmployees(rows: CDFRow[]): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => {
      if (r.deliveryAssociateName) set.add(r.deliveryAssociateName);
    });
    return Array.from(set).sort();
  }, [rows]);
}

export function useDateRange(rows: CDFRow[]): { min: string; max: string } {
  return useMemo(() => {
    let min = '';
    let max = '';
    rows.forEach(r => {
      if (!r.deliveryDate) return;
      const d = new Date(r.deliveryDate);
      if (isNaN(d.getTime())) return;
      const ds = d.toISOString().slice(0, 10);
      if (!min || ds < min) min = ds;
      if (!max || ds > max) max = ds;
    });
    return { min, max };
  }, [rows]);
}

export const CDF_DEFECT_COLORS: Record<string, string> = {
  mishandledPackage: '#ea4335',
  unprofessional: '#ff6d01',
  didNotFollowInstructions: '#fbbc04',
  deliveredToWrongAddress: '#34a853',
  neverReceivedDelivery: '#4285f4',
  receivedWrongItem: '#9c27b0',
};

export { CDF_DEFECT_COLUMNS, CDF_DEFECT_LABELS, CDF_DEFECT_SHORT_LABELS, type EmployeeSummary };
export type { CDFFilterState };
