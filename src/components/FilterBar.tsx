import { useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { getUniqueEmployees, getUniqueRTSCodes } from '../lib/utils';

export default function FilterBar() {
  const filters = useRTSStore(s => s.filters);
  const rawData = useRTSStore(s => s.rawData);
  const setFilters = useRTSStore(s => s.setFilters);
  const resetFilters = useRTSStore(s => s.resetFilters);

  const employees = useMemo(() => getUniqueEmployees(rawData), [rawData]);
  const rtsCodes = useMemo(() => getUniqueRTSCodes(rawData), [rawData]);

  const hasFilters = filters.employee || filters.search || filters.dateRange || filters.rtsCodes.length > 0 || filters.impactDcr;

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value ? new Date(
      +e.target.value.split('-')[0],
      +e.target.value.split('-')[1] - 1,
      +e.target.value.split('-')[2],
    ) : null;
    const endDate = filters.dateRange?.[1] || null;
    setFilters({
      dateRange: startDate ? [startDate, endDate] : [null, endDate],
    });
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parts = e.target.value.split('-').map(Number);
    const selectedDate = e.target.value
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : null;
    const startDate = filters.dateRange?.[0] || null;
    // Store end date as exclusive upper bound (selected date + 1 day).
    const endDate = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1)
      : null;
    setFilters({
      dateRange: endDate ? [startDate, endDate] : [startDate, null],
    });
  };

  const toInputDate = (d: Date): string => {
    const y = String(d.getFullYear()).padStart(4, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const displayEndDate = (d: Date): string => {
    const startDate = filters.dateRange?.[0];
    if (startDate && isSameDay(d, startDate)) return toInputDate(d);
    return toInputDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  };

  const toggleRTSCode = (code: string) => {
    const current = filters.rtsCodes;
    const updated = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    setFilters({ rtsCodes: updated });
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg section-card p-4"
    >
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-text-subtle" />
        <span className="text-sm font-medium text-text-subtle">Filters</span>
        {hasFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
          >
            Active
          </motion.span>
        )}
      </div>
 
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search all fields..."
            className="w-full rounded-md border border-surface-3 bg-surface-0 py-2 pl-9 pr-4 text-sm text-text-heading placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
 
        <select
          value={filters.employee}
          onChange={(e) => setFilters({ employee: e.target.value })}
          className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}>All Employees</option>
          {employees.map(emp => (
            <option key={emp} value={emp} style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}>{emp}</option>
          ))}
        </select>
 
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateRange?.[0] ? toInputDate(filters.dateRange[0]) : ''}
            onChange={handleDateStartChange}
            className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-text-subtle">to</span>
          <input
            type="date"
            value={filters.dateRange?.[1] ? displayEndDate(filters.dateRange[1]) : ''}
            onChange={handleDateEndChange}
            className="rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-text-heading transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
 
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-subtle">RTS:</span>
          <div className="flex flex-wrap gap-1">
            {rtsCodes.map(code => (
              <motion.button
                key={code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleRTSCode(code)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  filters.rtsCodes.includes(code)
                    ? 'bg-rts-active-bg text-rts-active-text'
                    : 'text-text-subtle hover:text-text-heading'
                }`}
              >
                {code}
              </motion.button>
             ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-subtle">Impact DCR:</span>
          <div className="flex gap-1">
            {['All', 'Y', 'N'].map(val => (
               <motion.button
                key={val}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ impactDcr: val === 'All' ? '' : val })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  (val === 'All' && !filters.impactDcr) || filters.impactDcr === val
                    ? 'bg-rts-active-bg text-rts-active-text'
                    : 'text-text-subtle hover:text-text-heading'
                }`}
              >
                {val}
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
