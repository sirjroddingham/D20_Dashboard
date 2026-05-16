import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { getEmployeeSummary } from '../lib/utils';

export default function Element3() {
  const filteredData = useRTSStore(s => s.filteredData);
  const filters = useRTSStore(s => s.filters);
  const setFilters = useRTSStore(s => s.setFilters);

  const employeeData = useMemo(() => getEmployeeSummary(filteredData), [filteredData]);

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
                <div className="flex items-center gap-3">
                  <div className="w-12 overflow-hidden rounded-full bg-surface-2 h-1.5">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(emp.percentage, 100)}%` }}
                    />
                  </div>
                  <span className={`w-10 text-right text-xs font-semibold ${
                    isActive ? ' text-text-heading' : 'text-text-subtle'
                  }`}>{emp.percentage}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-text-subtle/60">No employee data available for the current filters.</div>
      )}
    </motion.div>
  );
}
