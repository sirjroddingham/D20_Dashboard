import { useMemo, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { DSB_DEFECT_COLUMNS, DSB_DEFECT_LABELS } from '../lib/dsb/types';
import type { DSBRow } from '../lib/dsb/types';

interface DSBFilterState {
  employee: string;
  categories: string[];
  dateStart: string;
  dateEnd: string;
  search: string;
  impactsDsb: 'all' | 'Y' | 'N';
}

interface DSBBFilterBarProps {
  filters: DSBFilterState;
  rows: DSBRow[];
  dateRange: { min: string; max: string };
  onFilterChange: (filters: Partial<DSBFilterState>) => void;
}

export default function DSBBFilterBar({ filters, rows, dateRange, onFilterChange }: DSBBFilterBarProps) {
  const employees = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.deliveryAssociateName) set.add(r.deliveryAssociateName); });
    return Array.from(set).sort();
  }, [rows]);

  const hasFilters =
    filters.employee ||
    filters.categories.length > 0 ||
    filters.dateStart ||
    filters.dateEnd ||
    filters.search ||
    filters.impactsDsb !== 'all';

  const toggleCategory = useCallback(
    (cat: string) => {
      const updated = filters.categories.includes(cat)
        ? filters.categories.filter(c => c !== cat)
        : [...filters.categories, cat];
      onFilterChange({ categories: updated });
    },
    [filters.categories, onFilterChange]
  );

  const handleReset = useCallback(() => {
    onFilterChange({
      employee: '',
      categories: [],
      dateStart: '',
      dateEnd: '',
      search: '',
      impactsDsb: 'all',
    });
  }, [onFilterChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.employee) count++;
    count += filters.categories.length;
    if (filters.dateStart) count++;
    if (filters.dateEnd) count++;
    if (filters.search) count++;
    if (filters.impactsDsb !== 'all') count++;
    return count;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg section-card p-4"
    >
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-text-subtle" />
        <span className="text-sm font-medium text-text-subtle">DSB Filters</span>
        {hasFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {activeFilterCount} Active
          </motion.span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search all fields..."
            className="w-full rounded-md border border-surface-3 bg-surface-0 py-2 pl-9 pr-4 text-sm text-text-heading placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={filters.employee}
          onChange={(e) => onFilterChange({ employee: e.target.value })}
          className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}>
            All Employees
          </option>
          {employees.map(emp => (
            <option key={emp} value={emp} style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}>
              {emp}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateStart}
            placeholder={dateRange.min}
            min={dateRange.min}
            max={dateRange.max}
            onChange={(e) => onFilterChange({ dateStart: e.target.value })}
            className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-text-subtle">to</span>
          <input
            type="date"
            value={filters.dateEnd}
            placeholder={dateRange.max}
            min={dateRange.min}
            max={dateRange.max}
            onChange={(e) => onFilterChange({ dateEnd: e.target.value })}
            className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-subtle">Category:</span>
          <div className="flex flex-wrap gap-1">
            {DSB_DEFECT_COLUMNS.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  filters.categories.includes(cat)
                    ? 'bg-rts-active-bg text-rts-active-text'
                    : 'text-text-subtle hover:text-text-heading'
                }`}
              >
                {DSB_DEFECT_LABELS[cat as keyof typeof DSB_DEFECT_LABELS]}
              </motion.button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1 rounded-md bg-destructive/20 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30"
          >
            <X className="h-3 w-3" />
            Reset
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export type { DSBFilterState };
