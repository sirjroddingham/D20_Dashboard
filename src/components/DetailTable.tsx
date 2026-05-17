import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { Search, ChevronUp, ChevronDown, ChevronsUp, Download } from 'lucide-react';
import type { RTSDataRow } from '../lib/rts/types';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const COLUMNS = [
  { key: 'deliveryAssociate', label: 'Delivery Associate', width: 'w-[180px]' },
  { key: 'trackingId', label: 'Tracking ID', width: 'w-[150px]' },
  { key: 'impactDcr', label: 'Impact DCR', width: 'w-[80px]' },
  { key: 'rtsCode', label: 'RTS Code', width: 'w-[140px]' },
  { key: 'additionalInformation', label: 'Additional Info', width: 'w-[160px]' },
  { key: 'exemptionReason', label: 'Exemption Reason', width: 'w-[140px]' },
  { key: 'plannedDeliveryDate', label: 'Planned Date', width: 'w-[100px]' },
];

const ROWS_PER_PAGE = 50;

export default function DetailTable() {
  const filteredData = useRTSStore(s => s.filteredData);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'plannedDeliveryDate', direction: 'desc' });
  const [page, setPage] = useState(0);
  const [columnFilter, setColumnFilter] = useState<Record<string, string>>({});
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
    const searchTerm = columnFilter._global || '';
    let rows = filteredData;
    if (searchTerm) {
      rows = rows.filter(row =>
        COLUMNS.some(col =>
          String(row[col.key as keyof RTSDataRow] || '').toLowerCase().includes(searchTerm)
        )
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof RTSDataRow] || '';
      const bVal = b[sortConfig.key as keyof RTSDataRow] || '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredData, sortConfig, columnFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedData = sortedData.slice(safePage * ROWS_PER_PAGE, (safePage + 1) * ROWS_PER_PAGE);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setColumnFilter(prev => ({ ...prev, _global: searchTerm }));
    setPage(0);
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showSearch]);

  const hasSearchFilter = Boolean(columnFilter._global);

  const handleExportCSV = useCallback(() => {
    const headers = COLUMNS.map(col => col.label);
    const csvRows = [
      headers.join(','),
      ...sortedData.map(row =>
        COLUMNS.map(col => {
          const val = String(row[col.key as keyof RTSDataRow] ?? '');
          return '"' + val.replace(/"/g, '""') + '"';
        }).join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rts-details-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-lg section-card backdrop-blur-sm"
    >
      <div className="border-b border-surface-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-subtle">Delivery Details</h3>
          <div className="flex items-center gap-3">
            <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-subtle">
              {sortedData.length} records
            </span>
            <button
              onClick={toggleSearch}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showSearch
                  ? 'bg-primary/40 text-primary'
                  : 'surface-elevated text-text-subtle hover:bg-surface-hover'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Search Columns
              {hasSearchFilter && (
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
                  value={columnFilter._global || ''}
                  onChange={(e) => handleSearch(e)}
                  placeholder="Type to filter across all visible columns..."
                  className="flex-1 rounded-md border border-surface-3 bg-surface-0 px-3 py-1.5 text-sm text-text-heading placeholder:text-text-faint focus:border-primary focus:outline-none"
                />
                {hasSearchFilter && (
                  <button
                    onClick={() => { setColumnFilter({}); setPage(0); }}
                    className="text-xs text-text-subtle underline hover:text-text-heading"
                  >
                    Clear filters
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
                  <td className="px-4 py-2 text-text-heading">{row.deliveryAssociate}</td>
                  <td className="px-4 py-2 font-mono text-xs text-text-subtle">{row.trackingId}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="flex items-center justify-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        row.impactDcr === 'Y' ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-xs font-medium">{row.impactDcr}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      title={row.rtsCode}
                      className={`pill max-w-full truncate ${
                      row.rtsCode === 'OUT OF DRIVING TIME'
                        ? 'bg-destructive/20 text-destructive'
                        : row.rtsCode === 'NO RTS CODE SELECTED'
                        ? 'bg-secondary/20 text-secondary'
                         : 'pill-default'
                    }`}
                    >
                      {row.rtsCode}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-subtle">{row.additionalInformation || '-'}</td>
                  <td className="px-4 py-2 text-text-subtle">{row.exemptionReason || '-'}</td>
                  <td className="px-4 py-2 text-text-subtle">{row.plannedDeliveryDate}</td>
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
