import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ChevronsUp, Download } from 'lucide-react';
import type { CDFRow } from '../lib/cdf/types';
import type { CDFDefectColumn } from '../lib/cdf/types';
import { CDF_DEFECT_LABELS, CDF_DEFECT_COLORS } from '../store/useCDFStore';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const COLUMNS = [
  { key: 'deliveryAssociateName', label: 'Delivery Associate', width: 'w-[180px]' },
  { key: 'trackingId', label: 'Tracking ID', width: 'w-[150px]' },
  { key: 'defectCategories', label: 'Defect Category', width: 'w-[140px]' },
  { key: 'impactsDsb', label: 'Impacts DSB', width: 'w-[90px]' },
  { key: 'feedbackDetails', label: 'Feedback Details', width: 'w-[160px]' },
  { key: 'deliveryDate', label: 'Delivery Date', width: 'w-[160px]' },
];

const ROWS_PER_PAGE = 50;

interface CDFDetailTableProps {
  rows: CDFRow[];
}

export default function CDFDetailTable({ rows }: CDFDetailTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'deliveryDate', direction: 'desc' });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(0);
  }, []);

  const sortedData = useMemo(() => {
    let filtered = rows;
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(row =>
        COLUMNS.some(col => {
          if (col.key === 'defectCategories') {
            return row.defectCategories.some(c =>
              CDF_DEFECT_LABELS[c as CDFDefectColumn]?.toLowerCase().includes(term)
            );
          }
          return String(row[col.key as keyof CDFRow] || '').toLowerCase().includes(term);
        })
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof CDFRow] || '';
      const bVal = b[sortConfig.key as keyof CDFRow] || '';
      if (sortConfig.key === 'defectCategories') {
        const aStr = a.defectCategories.map(c => CDF_DEFECT_LABELS[c as CDFDefectColumn] || c).join(', ');
        const bStr = b.defectCategories.map(c => CDF_DEFECT_LABELS[c as CDFDefectColumn] || c).join(', ');
        const comparison = aStr.localeCompare(bStr);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      if (sortConfig.key === 'impactsDsb') {
        const comparison = Number(a.impactsDsb) - Number(b.impactsDsb);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [rows, sortConfig, search]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedData = sortedData.slice(safePage * ROWS_PER_PAGE, (safePage + 1) * ROWS_PER_PAGE);

  const handleToggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const handleExportCSV = useCallback(() => {
    const headers = COLUMNS.map(col => col.label);
    const csvRows = [
      headers.join(','),
      ...sortedData.map(row =>
        COLUMNS.map(col => {
          if (col.key === 'defectCategories') {
            const val = row.defectCategories.map(c => CDF_DEFECT_LABELS[c as CDFDefectColumn] || c).join('; ');
            return '"' + val.replace(/"/g, '""') + '"';
          }
          if (col.key === 'impactsDsb') {
            return '"' + (row.impactsDsb ? 'Y' : 'N') + '"';
          }
          const val = String(row[col.key as keyof CDFRow] ?? '');
          return '"' + val.replace(/"/g, '""') + '"';
        }).join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cdf-details-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-lg section-card backdrop-blur-sm"
    >
      <div className="border-b border-surface-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-subtle">Defect Details</h3>
          <div className="flex items-center gap-3">
            <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-subtle">
              {sortedData.length} records
            </span>
            <button
              onClick={handleToggleSearch}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showSearch
                  ? 'bg-primary/40 text-primary'
                  : 'surface-elevated text-text-subtle hover:bg-surface-hover'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Search Columns
              {search && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">1</span>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-md surface-elevated px-2.5 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:bg-surface-hover"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-text-subtle" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter across all visible columns..."
                  className="flex-1 rounded-md border border-surface-3 bg-surface-0 px-3 py-1.5 text-sm text-text-heading placeholder:text-text-faint focus:border-primary focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(0); }}
                    className="text-xs text-text-subtle underline hover:text-text-heading"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20 surface-elevated">
            <tr className="border-b border-surface-3 text-text-subtle">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`cursor-pointer select-none px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-subtle transition-colors hover:bg-surface-hover ${col.width}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc'
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={row._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15, delay: Math.min(index * 0.005, 0.1) }}
                  className="border-b border-surface-3/50 transition-colors hover:bg-surface-hover/50"
                >
                  <td className="px-4 py-2 text-text-heading">{row.deliveryAssociateName}</td>
                  <td className="px-4 py-2 font-mono text-xs text-text-subtle">{row.trackingId}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.defectCategories.map(cat => (
                        <span
                          key={cat}
                          title={CDF_DEFECT_LABELS[cat as keyof typeof CDF_DEFECT_LABELS]}
                          className="pill"
                          style={{
                            backgroundColor: (CDF_DEFECT_COLORS[cat] || '#888') + '33',
                            color: CDF_DEFECT_COLORS[cat] || '#888',
                          }}
                        >
                          {CDF_DEFECT_LABELS[cat as keyof typeof CDF_DEFECT_LABELS] || cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-text-subtle">
                    {row.impactsDsb ? 'Y' : 'N'}
                  </td>
                  <td className="px-4 py-2 text-text-subtle max-w-[200px] truncate" title={row.feedbackDetails}>
                    {row.feedbackDetails || '-'}
                  </td>
                  <td className="px-4 py-2 text-text-subtle">{formatDate(row.deliveryDate)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-text-subtle">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-surface-3 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-subtle">
              Page {safePage + 1} of {totalPages} ({sortedData.length} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={safePage === 0}
                className="rounded px-2 py-1 text-xs text-text-subtle disabled:opacity-30 hover:bg-surface-hover"
              >
                <ChevronsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="rounded px-2 py-1 text-xs text-text-subtle disabled:opacity-30 hover:bg-surface-hover"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (safePage < 3) {
                  pageNum = i;
                } else if (safePage > totalPages - 4) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = safePage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      safePage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-text-subtle hover:bg-surface-hover'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="rounded px-2 py-1 text-xs text-text-subtle disabled:opacity-30 hover:bg-surface-hover"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
