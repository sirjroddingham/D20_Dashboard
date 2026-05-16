import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { useDAPerformanceStore } from '../store/useDAPerformanceStore';
import { getEmployeeSummary, getTotalPackagesForDateRange, formatPercent } from '../lib/utils';

export default function Element3() {
  const filteredData = useRTSStore(s => s.filteredData);
  const filters = useRTSStore(s => s.filters);
  const setFilters = useRTSStore(s => s.setFilters);
  const scorecardRows = useDAPerformanceStore(s => s.rows);

  const totalPackages = useMemo(
    () => getTotalPackagesForDateRange(filteredData, scorecardRows),
    [filteredData, scorecardRows],
  );

  const employeeData = useMemo(
    () => getEmployeeSummary(filteredData, totalPackages),
    [filteredData, totalPackages],
  );

  const handleEmployeeClick = (name: string) => {
    if (filters.employee === name) {
      setFilters({ employee: '' });
    } else {
      setFilters({ employee: name });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-lg section-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle">Employee Summary</h3>
        <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-subtle">
          {employeeData.length} employees
        </span>
      </div>
      {employeeData.length > 0 ? (
        <div className="overflow-y-auto" style={{ maxHeight: '30vh' }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employeeData.map((emp) => {
            const isActive = filters.employee === emp.name;
            return (
              <motion.div
                key={emp.name}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleEmployeeClick(emp.name)}
                className={`cursor-pointer flex items-center justify-between rounded-md p-3 transition-colors ${
                  isActive
                    ? 'border-[hsl(var(--ring)/0.3)] surface-elevated'
                    : 'surface-elevated hover:border-[hsl(var(--ring)/0.2)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${
                    isActive ? ' text-text-heading' : 'text-text-subtle'
                  }`}>{emp.name}</p>
                  <p className="text-xs text-text-subtle/60">Total: {emp.count}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${
                    isActive ? 'text-text-heading' : 'text-text-subtle'
                  }`}>of RTS: {formatPercent(emp.percentage)}%</p>
                  <p className="text-xs text-text-subtle/60">of all pkgs: {formatPercent(emp.packagesPct)}%</p>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-text-subtle/60">No employee data available for the current filters.</div>
      )}
    </motion.div>
  );
}
