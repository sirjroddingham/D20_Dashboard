import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DSB_DEFECT_COLUMNS, DSB_DEFECT_LABELS } from '../lib/dsb/types';
interface DSBEmployeeSummary {
  transporterId: string;
  name: string;
  totalDefects: number;
  categories: Record<string, number>;
  trackingIds: string[];
}

interface DSBRankingTablesProps {
  summaries: DSBEmployeeSummary[];
}

const titleStyle = 'bg-surface-2 text-text-subtle';

const defectColorClass = (value: number) => {
  if (value === 0) return '';
  if (value >= 6) return 'defect-cell-critical';
  if (value >= 4) return 'defect-cell-high';
  if (value >= 2) return 'defect-cell-medium';
  return 'defect-cell-low';
};

export function DSBBottomPerformersTable({ summaries }: DSBRankingTablesProps) {
  const bottomData = useMemo(
    () => summaries.filter(e => e.totalDefects > 0).sort((a, b) => b.totalDefects - a.totalDefects),
    [summaries]
  );

  if (bottomData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden"
    >
      <div className={`px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider ${titleStyle}`}>
        DSB - Most Defects ({bottomData.length} employees)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              {DSB_DEFECT_COLUMNS.map(c => (
                 <th key={c} className="px-2 sm:px-3 py-1.5 text-center font-medium">
                  {DSB_DEFECT_LABELS[c as keyof typeof DSB_DEFECT_LABELS] || c}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {bottomData.map((emp, idx) => (
              <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                <td className="px-2 sm:px-3 py-1 text-center font-bold">{idx + 1}</td>
                <td className="px-2 sm:px-3 py-1">
                  <div className="font-medium text-text-heading">{emp.name}</div>
                </td>
                {DSB_DEFECT_COLUMNS.map(c => {
                  const val = emp.categories[c] || 0;
                  return (
                    <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium text-text-heading ${defectColorClass(val)}`}>
                      {val}
                    </td>
                  );
                })}
                <td className="px-2 sm:px-3 py-1 text-right font-bold">{emp.totalDefects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function DSBDefectFreeTable({ summaries }: DSBRankingTablesProps) {
  const data = useMemo(
    () => summaries.filter(e => e.totalDefects === 0),
    [summaries]
  );

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden border-2 border-amber-500/60 shadow-[0_0_12px_2px_rgba(245,158,11,0.25)]"
    >
      <div className="px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-text-heading">
        DSB - Defect-Free ({data.length} employees)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              {DSB_DEFECT_COLUMNS.map(c => (
                <th key={c} className="px-2 sm:px-3 py-1.5 text-center font-medium">
                  {DSB_DEFECT_LABELS[c as keyof typeof DSB_DEFECT_LABELS] || c}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((emp, idx) => (
              <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                <td className="px-2 sm:px-3 py-1 text-center font-bold">{idx + 1}</td>
                <td className="px-2 sm:px-3 py-1">
                  <div className="font-medium text-text-heading">{emp.name}</div>
                </td>
                {DSB_DEFECT_COLUMNS.map(c => {
                  const val = emp.categories[c] || 0;
                  return (
                    <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium text-text-heading ${
                      val === 0 ? 'defect-free-zero' : defectColorClass(val)
                    }`}>
                      {val}
                    </td>
                  );
                })}
                <td className={`px-2 sm:px-3 py-1 text-right font-bold text-text-heading defect-free-zero`}>
                  {emp.totalDefects}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export type { DSBEmployeeSummary };
