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
  if (value >= 6) return 'bg-red-500/30 text-red-400';
  if (value >= 4) return 'bg-orange-500/30 text-orange-400';
  if (value >= 2) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-amber-500/15 text-amber-300';
};

const dpmoColorClass = (dpmo: number | null, maxDPMO: number) => {
  if (dpmo === null || dpmo === 0) return 'text-text-subtle';
  if (maxDPMO === 0) return '';
  const pct = (dpmo / maxDPMO) * 100;
  if (pct >= 80) return 'bg-red-500/30 text-red-400';
  if (pct >= 60) return 'bg-orange-500/30 text-orange-400';
  if (pct >= 40) return 'bg-yellow-500/20 text-yellow-400';
  return '';
};

export function BottomPerformersTable({ summaries }: CDFRankingTablesProps) {
  const bottomData = useMemo(
    () => summaries.filter(e => e.totalDefects > 0).sort((a, b) => b.totalDefects - a.totalDefects),
    [summaries]
  );

  if (bottomData.length === 0) return null;

  const maxDPMO = Math.max(...bottomData.map(e => e.dpmo || 0), 1);
  const maxByCat: Record<string, number> = {};
  CDF_DEFECT_COLUMNS.forEach(c => {
    maxByCat[c] = Math.max(...bottomData.map(e => e.categories[c] || 0), 1);
  });

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
                  {(CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c).split(' ').slice(-1)[0]}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">DPMO</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
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
                    <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium ${defectColorClass(val)}`}>
                      {val}
                    </td>
                  );
                })}
                <td className="px-2 sm:px-3 py-1 text-right font-bold">{emp.totalDefects}</td>
                <td className={`px-2 sm:px-3 py-1 text-right font-bold tabular-nums hidden sm:table-cell ${dpmoColorClass(emp.dpmo, maxDPMO)}`}>
                  {emp.dpmo !== null ? emp.dpmo.toLocaleString() : 'N/A'}
                </td>
                <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                  {emp.packages > 0 ? emp.packages.toLocaleString() : '-'}
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
                  {(CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c).split(' ').slice(-1)[0]}
                </th>
              ))}
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">DPMO</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
            </tr>
          </thead>
          <tbody>
            {topData.map((emp, idx) => {
              const isZero = emp.totalDefects === 0;
              return (
                <tr key={emp.transporterId} className="border-b border-surface-3/30 last:border-b-0">
                  <td className="px-2 sm:px-3 py-1 text-center font-bold text-emerald-400">{idx + 1}</td>
                  <td className="px-2 sm:px-3 py-1">
                    <div className="font-medium text-text-heading">{emp.name}</div>
                  </td>
                  {CDF_DEFECT_COLUMNS.map(c => {
                    const val = emp.categories[c] || 0;
                    return (
                      <td key={c} className={`px-2 sm:px-3 py-1 text-center font-medium ${
                        isZero ? 'bg-emerald-500/20 text-emerald-400' : 'text-text-heading'
                      }`}>
                        {val}
                      </td>
                    );
                  })}
                  <td className={`px-2 sm:px-3 py-1 text-right font-bold ${
                    isZero ? 'text-emerald-400' : 'text-yellow-400'
                  }`}>
                    {emp.totalDefects}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right tabular-nums hidden sm:table-cell text-text-subtle">
                    {emp.dpmo !== null ? emp.dpmo.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {emp.packages > 0 ? emp.packages.toLocaleString() : '-'}
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
