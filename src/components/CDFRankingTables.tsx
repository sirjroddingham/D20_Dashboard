import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { EmployeeSummary } from '../store/useCDFStore';
import { CDF_DEFECT_COLUMNS, CDF_DEFECT_LABELS } from '../store/useCDFStore';

interface CDFRankingTablesProps {
  summaries: EmployeeSummary[];
}

const titleStyle = 'bg-surface-2 text-text-subtle';

const defectColorClass = (value: number) => {
  if (value === 0) return '';
  if (value >= 6) return 'defect-cell-critical';
  if (value >= 4) return 'defect-cell-high';
  if (value >= 2) return 'defect-cell-medium';
  return 'defect-cell-low';
};

const dpmoColorClass = (dpmo: number | null) => {
  if (dpmo === null || dpmo === 0) return 'text-text-subtle';
  if (dpmo >= 10000) return 'dpmo-cell-critical';
  if (dpmo >= 7500) return 'dpmo-cell-very-high';
  if (dpmo >= 5000) return 'dpmo-cell-high';
  if (dpmo >= 3500) return 'dpmo-cell-orange';
  if (dpmo >= 2500) return 'dpmo-cell-amber';
  if (dpmo >= 1500) return 'dpmo-cell-yellow';
  return '';
};

export function BottomPerformersTable({ summaries }: CDFRankingTablesProps) {
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
        Most Defects ({bottomData.length} employees)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              {CDF_DEFECT_COLUMNS.map(c => (
                <th key={c} className="px-2 sm:px-3 py-1.5 text-center font-medium" title={CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS]}>
                  {(CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c)}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">DPMO</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Wks</th>
            </tr>
          </thead>
          <tbody>
            {bottomData.map((emp, idx) => (
              <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                <td className="px-2 sm:px-3 py-1 text-center font-bold">{idx + 1}</td>
                <td className="px-2 sm:px-3 py-1">
                  <div className="font-medium text-text-heading">{emp.name}</div>
                </td>
                {CDF_DEFECT_COLUMNS.map(c => {
                  const val = emp.categories[c] || 0;
                  return (
                    <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium text-text-heading ${defectColorClass(val)}`}>
                      {val}
                    </td>
                  );
                })}
                <td className="px-2 sm:px-3 py-1 text-right font-bold">{emp.totalDefects}</td>
                <td className={`px-2 sm:px-3 py-1 text-right font-bold tabular-nums hidden sm:table-cell ${dpmoColorClass(emp.dpmo)}`}>
                  {emp.dpmo !== null ? emp.dpmo.toLocaleString() : 'N/A'}
                </td>
                <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                  {emp.packages > 0 ? emp.packages.toLocaleString() : '-'}
                </td>
                <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                  {emp.weeksInRange > 0 ? emp.weeksInRange : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function TopPerformersTable({ summaries }: CDFRankingTablesProps) {
  const topData = useMemo(() => {
    const zeroDefect = summaries.filter(e => e.totalDefects === 0);
    const nonZero = summaries.filter(e => e.totalDefects > 0);

    zeroDefect.sort((a, b) => b.packages - a.packages);
    nonZero.sort((a, b) => a.totalDefects - b.totalDefects);

    const result = [...zeroDefect];
    if (result.length < 15) {
      result.push(...nonZero.slice(0, 15 - result.length));
    }
    return result;
  }, [summaries]);

  if (topData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden"
    >
      <div className={`px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider ${titleStyle}`}>
        Fewest Defects ({topData.length} employees)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              {CDF_DEFECT_COLUMNS.map(c => (
                <th key={c} className="px-2 sm:px-3 py-1.5 text-center font-medium" title={CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS]}>
                  {(CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c)}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">DPMO</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Wks</th>
            </tr>
          </thead>
          <tbody>
            {topData.map((emp, idx) => {
              const isZero = emp.totalDefects === 0;
              return (
                <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                  <td className="px-2 sm:px-3 py-1 text-center font-bold">{idx + 1}</td>
                  <td className="px-2 sm:px-3 py-1">
                    <div className="font-medium text-text-heading">{emp.name}</div>
                  </td>
                  {CDF_DEFECT_COLUMNS.map(c => {
                    const val = emp.categories[c] || 0;
                    return (
                      <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium text-text-heading ${
                        isZero ? 'defect-free-zero' : defectColorClass(val)
                      }`}>
                        {val}
                      </td>
                    );
                  })}
                  <td className={`px-2 sm:px-3 py-1 text-right font-bold text-text-heading ${
                    isZero ? 'defect-free-zero' : 'defect-free-total'
                  }`}>
                    {emp.totalDefects}
                  </td>
                  <td className={`px-2 sm:px-3 py-1 text-right font-bold tabular-nums hidden sm:table-cell ${dpmoColorClass(emp.dpmo)}`}>
                    {emp.dpmo !== null ? emp.dpmo.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {emp.packages > 0 ? emp.packages.toLocaleString() : '-'}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {emp.weeksInRange > 0 ? emp.weeksInRange : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function DefectFreeTable({ summaries }: CDFRankingTablesProps) {
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
        Defect-Free ({data.length} employees)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              {CDF_DEFECT_COLUMNS.map(c => (
                <th key={c} className="px-2 sm:px-3 py-1.5 text-center font-medium" title={CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS]}>
                  {(CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c)}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">DPMO</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Wks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((emp, idx) => (
              <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                <td className="px-2 sm:px-3 py-1 text-center font-bold">{idx + 1}</td>
                <td className="px-2 sm:px-3 py-1">
                  <div className="font-medium text-text-heading">{emp.name}</div>
                </td>
                {CDF_DEFECT_COLUMNS.map(c => {
                  const val = emp.categories[c] || 0;
                  return (
                    <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium text-text-heading ${defectColorClass(val)}`}>
                      {val}
                    </td>
                  );
                })}
                <td className="px-2 sm:px-3 py-1 text-right font-bold">{emp.totalDefects}</td>
                <td className={`px-2 sm:px-3 py-1 text-right font-bold tabular-nums hidden sm:table-cell ${dpmoColorClass(emp.dpmo)}`}>
                  {emp.dpmo !== null ? emp.dpmo.toLocaleString() : 'N/A'}
                </td>
                <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                  {emp.packages > 0 ? emp.packages.toLocaleString() : '-'}
                </td>
                <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums">
                  {emp.weeksInRange > 0 ? emp.weeksInRange : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
