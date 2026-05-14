import { create } from 'zustand';
import type { ScorecardRow, DATrailingAvg } from '../lib/scorecard/types';

export const STANDARD_SAFETY_WEIGHT = 52.1;
export const STANDARD_QUALITY_WEIGHT = 48.2;

interface DAPerformanceState {
  rows: ScorecardRow[];
  loadedWeeks: string[];
  mostRecentWeek: string;
  fileName: string;
  _trailingAverages: DATrailingAvg[];

  mergeRows: (newRows: ScorecardRow[]) => void;
  rowsForWeek: (week: string) => ScorecardRow[];
  trailingAverages: DATrailingAvg[];
  setFileName: (name: string) => void;
  clearData: () => void;
}

function computeTrailingAverages(
  rows: ScorecardRow[]
): DATrailingAvg[] {
  const groups: Record<string, ScorecardRow[]> = {};
  rows.forEach(row => {
    if (!groups[row.transporterId]) groups[row.transporterId] = [];
    groups[row.transporterId].push(row);
  });

  return Object.values(groups).map(weekRows => {
    const scores = weekRows.map(r => r.overallScore).filter(s => s > 0);
    const safetyScores = weekRows
      .filter(r => r.hasSafetyData)
      .map(r => r.normalizedSafetyScore);
    const qualityScores = weekRows.map(r => r.normalizedQualityScore).filter(s => s > 0);

    return {
      transporterId: weekRows[0].transporterId,
      name: weekRows[0].name,
      weekCount: weekRows.length,
      totalPackages: weekRows.reduce((sum, r) => sum + r.packagesDelivered, 0),
      avgOverallScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      avgSafetyScore: safetyScores.length > 0 ? safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length : 0,
      avgQualityScore: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0,
    };
  });
}

export const useDAPerformanceStore = create<DAPerformanceState>((set, get) => ({
  rows: [],
  loadedWeeks: [],
  mostRecentWeek: '',
  fileName: '',
  _trailingAverages: [],
  trailingAverages: [],

  mergeRows: (newRows) => {
    const existing = get().rows;
    const existingKeys = new Set(existing.map(r => `${r.week}::${r.transporterId}`));
    const toAdd = newRows.filter(r => !existingKeys.has(`${r.week}::${r.transporterId}`));

    if (toAdd.length === 0) {
      set({ fileName: `${newRows[0]?.week ?? 'Week'} uploaded (duplicate, no new data)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const weeks = [...new Set(merged.map(r => r.week))].sort();
    const mostRecent = weeks.length > 0 ? weeks[weeks.length - 1] : '';
    const trailingAvgs = computeTrailingAverages(merged);

    set({
      rows: merged,
      loadedWeeks: weeks,
      mostRecentWeek: mostRecent,
      fileName: `${toAdd.length} rows added (${weeks.length} week(s) loaded)`,
      _trailingAverages: trailingAvgs,
      trailingAverages: trailingAvgs,
    });
  },

  rowsForWeek: (week) => {
    return get().rows.filter(r => r.week === week);
  },

  setFileName: (name) => set({ fileName: name }),

  clearData: () => {
    set({
      rows: [],
      loadedWeeks: [],
      mostRecentWeek: '',
      fileName: '',
      _trailingAverages: [],
      trailingAverages: [],
    });
  },
}));
