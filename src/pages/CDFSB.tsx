import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, BarChart3, Trash2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSourceStore } from '../store/useDataSourceStore';
import {
  useCDFData,
  useFilteredRows,
  useEmployeeSummaries,
  useCategoryTotals,
  useDateRange,
  useDefectFreeEmployees,
  type CDFFilterState,
} from '../store/useCDFStore';
import type { CDFRow } from '../lib/cdf/types';
import type { DSBRow } from '../lib/dsb/types';
import { DSB_DEFECT_COLUMNS, DSB_DEFECT_LABELS } from '../lib/dsb/types';
import { dateToISOWeek } from '../lib/rts/helpers';
import DataUpload from '../components/DataUpload';
import CDFFilterBar from '../components/CDFFilterBar';
import CDFDetailTable from '../components/CDFDetailTable';
import { BottomPerformersTable, DefectFreeTable } from '../components/CDFRankingTables';
import { CDFCategoryChart, CDFDefectsByDayChart } from '../components/CDFCharts';
import DSBBFilterBar, { type DSBFilterState } from '../components/DSBBFilterBar';
import { DSBBottomPerformersTable } from '../components/DSBBRankingTables';
import { DSBCategoryChart, DSBDefectsByDayChart } from '../components/DSBCharts';
import DSBDetailTable from '../components/DSBDDetailTable';

const defaultFilters: CDFFilterState = {
  employee: '',
  categories: [],
  dateStart: '',
  dateEnd: '',
  search: '',
  impactsDsb: 'all',
};

const defaultDSBFilters: DSBFilterState = {
  employee: '',
  categories: [],
  dateStart: '',
  dateEnd: '',
  search: '',
  impactsDsb: 'all',
};

interface DSBEmployeeSummary {
  transporterId: string;
  name: string;
  totalDefects: number;
  categories: Record<string, number>;
  trackingIds: string[];
}

function useFilteredDSBRows(rows: DSBRow[], selectedWeek: string, filters: DSBFilterState): DSBRow[] {
  return useMemo(() => {
    let filtered = rows;

    if (selectedWeek && selectedWeek !== '__all__') {
      filtered = filtered.filter(r => {
        const week = dateToISOWeek(r.concessionDate || r.deliveryDate);
        return week === selectedWeek;
      });
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
        // concessionDate is authoritative; deliveryDate only used when no concessionDate
        const d = r.concessionDate;
        if (!d) return true; // no concession date — don't exclude
        return new Date(d) >= start;
      });
    }

    if (filters.dateEnd) {
      const end = new Date(filters.dateEnd);
      end.setDate(end.getDate() + 1);
      filtered = filtered.filter(r => {
        const d = r.concessionDate;
        if (!d) return true;
        return new Date(d) < end;
      });
    }

    if (filters.impactsDsb !== 'all') {
      const wantImpact = filters.impactsDsb === 'Y';
      filtered = filtered.filter(r => r.impactsDsb === wantImpact);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.deliveryAssociateName.toLowerCase().includes(term) ||
        r.trackingId.toLowerCase().includes(term) ||
        (r.concessionDate || '').toLowerCase().includes(term) ||
        (r.deliveryDate || '').toLowerCase().includes(term) ||
        r.defectCategories.some(c => DSB_DEFECT_LABELS[c as keyof typeof DSB_DEFECT_LABELS]?.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [rows, selectedWeek, filters]);
}

function useDSBEmployeeSummaries(rows: DSBRow[]): DSBEmployeeSummary[] {
  return useMemo(() => {
    const empMap = new Map<string, DSBEmployeeSummary>();

    rows.forEach(r => {
      if (!empMap.has(r.deliveryAssociate)) {
        const cats: Record<string, number> = {};
        DSB_DEFECT_COLUMNS.forEach(c => { cats[c] = 0; });
        empMap.set(r.deliveryAssociate, {
          transporterId: r.deliveryAssociate,
          name: r.deliveryAssociateName,
          totalDefects: 0,
          categories: cats,
          trackingIds: [],
        });
      }

      const emp = empMap.get(r.deliveryAssociate)!;
      emp.trackingIds.push(r.trackingId);
      r.defectCategories.forEach(c => {
        emp.categories[c] = (emp.categories[c] || 0) + 1;
      });
      emp.totalDefects += r.defectCategories.length;
    });

    const summaries = Array.from(empMap.values());
    summaries.sort((a, b) => b.totalDefects - a.totalDefects);
    return summaries;
  }, [rows]);
}

function useDSBCategoryTotals(rows: DSBRow[]): Record<string, number> {
  return useMemo(() => {
    const totals: Record<string, number> = {};
    DSB_DEFECT_COLUMNS.forEach(c => { totals[c] = 0; });
    rows.forEach(r => {
      // Use defectCategories (includes 'other' for unflagged rows) so every
      // row is counted exactly once in its assigned category.
      r.defectCategories.forEach(c => {
        totals[c] = (totals[c] || 0) + 1;
      });
    });
    return totals;
  }, [rows]);
}

function useDSBDateRange(rows: DSBRow[]): { min: string; max: string } {
  return useMemo(() => {
    let min = '';
    let max = '';
    rows.forEach(r => {
      // Use concessionDate as the authoritative date; deliveryDate can precede the
      // concession by weeks and must not anchor the date range bounds.
      const d = r.concessionDate;
      if (!d) return;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return;
      const ds = dt.toISOString().slice(0, 10);
      if (!min || ds < min) min = ds;
      if (!max || ds > max) max = ds;
    });
    return { min, max };
  }, [rows]);
}



export default function CDFSB() {
  const {
    cdfRows,
    cdfLoadedWeeks,
    cdfLastUpload,
    scorecardRows,
  } = useCDFData();

  const dsbRows = useDataSourceStore(s => s.dsbRows);
  const dsbLoadedWeeks = useDataSourceStore(s => s.dsbLoadedWeeks);
  const dsbLastUpload = useDataSourceStore(s => s.dsbLastUpload);

  const clearCdf = useDataSourceStore(s => s.clearCdf);
  const clearDsb = useDataSourceStore(s => s.clearDsb);

  const [selectedWeek, setSelectedWeek] = useState<string>('__all__');

  useEffect(() => {
    if (cdfLoadedWeeks.length > 0 && selectedWeek !== '__all__') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedWeek('__all__');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on cdfLoadedWeeks change
  }, [cdfLoadedWeeks]);

  const [dsbSelectedWeek, setDsbSelectedWeek] = useState<string>('__all__');

  useEffect(() => {
    if (dsbLoadedWeeks.length > 0 && dsbSelectedWeek !== '__all__') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDsbSelectedWeek('__all__');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on dsbLoadedWeeks change
  }, [dsbLoadedWeeks]);

  const [filters, setFilters] = useState<CDFFilterState>(defaultFilters);

  const handleFilterChange = (partial: Partial<CDFFilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  };

  const [dsbFilters, setDsbFilters] = useState<DSBFilterState>(defaultDSBFilters);

  const handleDsbFilterChange = (partial: Partial<DSBFilterState>) => {
    setDsbFilters(prev => ({ ...prev, ...partial }));
  };

  const enrichedCdfRows = useMemo<CDFRow[]>(() => {
    const dsbTrackingIds = new Set(dsbRows.map(r => r.trackingId));
    return cdfRows.map(r => ({
      ...r,
      impactsDsb: dsbTrackingIds.has(r.trackingId),
    }));
  }, [cdfRows, dsbRows]);

  const filteredRows = useFilteredRows(enrichedCdfRows, selectedWeek, filters);
  const employeeSummaries = useEmployeeSummaries(filteredRows, scorecardRows, selectedWeek);
  const defectFreeSummaries = useDefectFreeEmployees(enrichedCdfRows, scorecardRows);
  const categoryTotals = useCategoryTotals(filteredRows);
  const dateRange = useDateRange(enrichedCdfRows);

  const weekRows = filteredRows;

  // DSB derived data
  const filteredDSBRows = useFilteredDSBRows(dsbRows, dsbSelectedWeek, dsbFilters);
  const dsbEmployeeSummaries = useDSBEmployeeSummaries(filteredDSBRows);
  const dsbCategoryTotals = useDSBCategoryTotals(filteredDSBRows);
  // Date range bounds follow the selected week (no other filters), so the date
  // inputs stay anchored to the visible week rather than the full dataset.
  const dsbWeekRows = useMemo(() => {
    if (!dsbSelectedWeek || dsbSelectedWeek === '__all__') return dsbRows;
    return dsbRows.filter(r => {
      const week = dateToISOWeek(r.concessionDate || r.deliveryDate);
      return week === dsbSelectedWeek;
    });
  }, [dsbRows, dsbSelectedWeek]);
  const dsbDateRange = useDSBDateRange(dsbWeekRows);


  const hasData = enrichedCdfRows.length > 0;
  const hasDSBData = dsbRows.length > 0;

  const allWeeksOption = '__all__';

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-surface-1 p-4 border border-surface-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-heading">CDF / DSB</h1>
          {cdfLastUpload && (
            <div className="flex items-center gap-2 pill-file">
              <FileText className="h-3.5 w-3.5 text-text-subtle" />
              <span className="text-xs text-text-subtle">{cdfLastUpload}</span>
            </div>
          )}
          {dsbLastUpload && (
            <div className="flex items-center gap-2 pill-file">
              <FileText className="h-3.5 w-3.5 text-text-subtle" />
              <span className="text-xs text-text-subtle">{dsbLastUpload}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/data"
            className="cursor-pointer rounded p-1.5 text-text-body transition-colors hover:bg-surface-hover hover:text-text-subtle"
            title="Upload data"
          >
            <Database className="h-4 w-4" />
          </Link>
          {hasData && (
            <button
              type="button"
              onClick={clearCdf}
              className="cursor-pointer rounded p-1.5 text-text-body transition-colors hover:bg-surface-hover hover:text-red-400"
              title="Clear all CDF data"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {hasDSBData && (
            <button
              type="button"
              onClick={clearDsb}
              className="cursor-pointer rounded p-1.5 text-text-body transition-colors hover:bg-surface-hover hover:text-red-400"
              title="Clear all DSB data"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <DataUpload compact />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!hasData ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-6 rounded-xl bg-surface-1 border border-surface-3 p-6"
              >
                <BarChart3 className="h-16 w-16 text-text-icon" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-bold text-text-heading">CDF Defect Dashboard</h2>
              <p className="mb-8 max-w-md text-center text-sm text-text-subtle">
                Upload one or more CDF CSV files to analyze customer delivery feedback defects, employee rankings, and DPMO metrics.
              </p>
              <div className="w-full max-w-lg">
                <DataUpload />
              </div>
              <Link
                to="/data"
                className="mt-4 flex items-center gap-1.5 text-sm text-text-body hover:text-text-subtle transition-colors"
              >
                <Database className="h-4 w-4" />
                Manage all data uploads
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 rounded-lg section-card p-4">
              <label className="text-sm font-medium text-text-subtle">Week:</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="rounded-md border border-surface-3 bg-surface-0 px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {cdfLoadedWeeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
                {cdfLoadedWeeks.length > 1 && (
                  <option value={allWeeksOption}>All Weeks ({cdfLoadedWeeks.length})</option>
                )}
              </select>

              <span className="pill pill-default">
                {weekRows.length} rows
              </span>
              {cdfLoadedWeeks.length > 0 && (
                <span className="pill pill-default">
                  {cdfLoadedWeeks.length} week(s) loaded
                </span>
              )}
            </div>

            <CDFFilterBar
              filters={filters}
              rows={cdfRows}
              dateRange={dateRange}
              onFilterChange={handleFilterChange}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CDFCategoryChart categoryTotals={categoryTotals} />
              <CDFDefectsByDayChart rows={weekRows} />
            </div>

            <BottomPerformersTable summaries={employeeSummaries} />
            <DefectFreeTable summaries={defectFreeSummaries} />

            <CDFDetailTable rows={filteredRows} />

            {/* DSB Section */}
            {hasDSBData && (
              <>
                <div className="border-t-2 border-surface-3 pt-4 mt-8">
                  <h2 className="text-lg font-medium text-text-heading mb-4">DSB Delivery Concessions</h2>
                </div>

                <div className="flex items-center gap-4 rounded-lg section-card p-4">
                  <label className="text-sm font-medium text-text-subtle">Week:</label>
                  <select
                    value={dsbSelectedWeek}
                    onChange={(e) => setDsbSelectedWeek(e.target.value)}
                    className="rounded-md border border-surface-3 bg-surface-0 px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {dsbLoadedWeeks.map(week => (
                      <option key={week} value={week}>{week}</option>
                    ))}
                    {dsbLoadedWeeks.length > 1 && (
                      <option value={allWeeksOption}>All Weeks ({dsbLoadedWeeks.length})</option>
                    )}
                  </select>
                  <span className="text-xs font-medium text-text-subtle">Impacts DSB:</span>
                  <div className="flex gap-1">
                    {(['all', 'Y', 'N'] as const).map(val => (
                      <motion.button
                        key={val}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDsbFilters(prev => ({ ...prev, impactsDsb: val }))}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                          dsbFilters.impactsDsb === val
                            ? 'bg-rts-active-bg text-rts-active-text'
                            : 'text-text-subtle hover:text-text-heading'
                        }`}
                      >
                        {val === 'all' ? 'All' : val}
                      </motion.button>
                    ))}
                  </div>
                  <span className="pill pill-default">
                    {filteredDSBRows.length} rows
                  </span>
                  {dsbLoadedWeeks.length > 0 && (
                    <span className="pill pill-default">
                      {dsbLoadedWeeks.length} week(s) loaded
                    </span>
                  )}
                </div>

                <DSBBFilterBar
                  filters={dsbFilters}
                  rows={dsbRows}
                  dateRange={dsbDateRange}
                  onFilterChange={handleDsbFilterChange}
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <DSBCategoryChart categoryTotals={dsbCategoryTotals} />
                  <DSBDefectsByDayChart rows={filteredDSBRows} />
                </div>

                <DSBBottomPerformersTable summaries={dsbEmployeeSummaries} />

                <DSBDetailTable rows={filteredDSBRows} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
