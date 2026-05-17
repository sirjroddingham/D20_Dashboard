import { useEffect, useMemo, useState } from 'react';
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
  type CDFFilterState,
} from '../store/useCDFStore';
import DataUpload from '../components/DataUpload';
import CDFFilterBar from '../components/CDFFilterBar';
import CDFDetailTable from '../components/CDFDetailTable';
import { BottomPerformersTable, TopPerformersTable } from '../components/CDFRankingTables';
import { CDFCategoryChart, CDFDefectSplitChart } from '../components/CDFCharts';

const defaultFilters: CDFFilterState = {
  employee: '',
  categories: [],
  dateStart: '',
  dateEnd: '',
  search: '',
};

export default function CDFSB() {
  const {
    cdfRows,
    cdfLoadedWeeks,
    cdfLastUpload,
    mostRecentWeek,
    scorecardRows,
  } = useCDFData();

  const clearCdf = useDataSourceStore(s => s.clearCdf);

  const [selectedWeek, setSelectedWeek] = useState<string>(mostRecentWeek);

  useEffect(() => {
    if (mostRecentWeek && mostRecentWeek !== selectedWeek) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedWeek(mostRecentWeek);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on mostRecentWeek change
  }, [mostRecentWeek]);

  const [filters, setFilters] = useState<CDFFilterState>(defaultFilters);

  const handleFilterChange = (partial: Partial<CDFFilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  };

  const filteredRows = useFilteredRows(cdfRows, selectedWeek, filters);
  const employeeSummaries = useEmployeeSummaries(cdfRows, scorecardRows, selectedWeek);
  const categoryTotals = useCategoryTotals(cdfRows, selectedWeek);
  const dateRange = useDateRange(cdfRows);

  const weekRows = useMemo(() => {
    if (selectedWeek === '__all__') return cdfRows;
    if (!selectedWeek) return cdfRows;
    return filteredRows;
  }, [cdfRows, selectedWeek, filteredRows]);

  const hasData = cdfRows.length > 0;

  const allWeeksOption = '__all__';

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-surface-1 p-4 border border-surface-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-text-heading">CDF / DSB</h1>
          {cdfLastUpload && (
            <div className="flex items-center gap-2 pill-file">
              <FileText className="h-3.5 w-3.5 text-text-subtle" />
              <span className="text-xs text-text-subtle">{cdfLastUpload}</span>
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
            <div className="flex items-center gap-4 rounded-lg section-card backdrop-blur-sm p-4">
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
              <CDFDefectSplitChart summaries={employeeSummaries} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BottomPerformersTable summaries={employeeSummaries} />
              <TopPerformersTable summaries={employeeSummaries} />
            </div>

            <CDFDetailTable rows={filteredRows} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
